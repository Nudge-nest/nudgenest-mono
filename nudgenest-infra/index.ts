import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";

const config = new pulumi.Config();

const secrets = {
    // Core Backend Secrets
    DATABASE_URL: config.get("BACKEND_DATABASE_URL"),
    RESEND_API_KEY: config.get("BACKEND_RESEND_API_KEY"),
    RESEND_FROM_EMAIL: config.get("BACKEND_RESEND_FROM_EMAIL"),
    SHOPIFY_API_SECRET: config.get("BACKEND_SHOPIFY_API_SECRET"),
    NODE_ENV: config.get("NODE_ENV") || "production",

    // Google Cloud Configuration
    GOOGLE_CLOUD_PROJECT_ID: config.get("GOOGLE_CLOUD_PROJECT_ID") || "nudgenest",
    GCS_BUCKET_NAME: config.get("GCS_BUCKET_NAME") || "nudgenest-media",

    // Frontend Configuration
    VITE_APP_BACKEND_HOST: config.get("VITE_APP_BACKEND_HOST"),
    REVIEW_UI_BASE_URL: config.get("REVIEW_UI_BASE_URL"),
    VITE_APP_REVIEW_UI_URL: config.get("VITE_APP_REVIEW_UI_URL"),
    VITE_APP_DEMO_MERCHANT_ID: config.get("VITE_APP_DEMO_MERCHANT_ID"),

    // CI/CD Secrets
    GITHUB_TOKEN: config.get("GITHUB_TOKEN"),
    GITHUB_APP_INSTALLER_ID: config.get("GITHUB_APP_INSTALLER_ID"),

    // Sentry Error Monitoring (GCP-deployed services only)
    SENTRY_BACKEND_DSN: config.get("SENTRY_BACKEND_DSN"),
    VITE_APP_SENTRY_FE_DSN: config.get("VITE_APP_SENTRY_FE_DSN"),
    // SENTRY_AUTH_TOKEN, SENTRY_ORG, SENTRY_PROJECT_REVIEW_UI are Sentry CLI
    // source-map upload credentials — not required for error reporting (DSNs above
    // handle that). Add via `pulumi config set --secret` when source map upload is needed.

    // AI Features
    ANTHROPIC_API_KEY: config.get("BACKEND_ANTHROPIC_API_KEY"),

    // Deprecated - kept for backward compatibility during migration
    // RABBITMQ_URL_AWS: Migrated to Pub/Sub
    // SENDGRID_API_KEY: Migrated to Resend
    // GOOGLE_APP_PASSWORD: Not needed with Resend
    // APP_AWS_*: Migrated to GCS
}

// Create a GCP resources
const serviceAccount = gcp.serviceaccount.getAccount({accountId: "pulumi-deploys@nudgenest.iam.gserviceaccount.com"});
//Create Secrets
const nudgenestSecretsArray = Object.keys(secrets).map((secret) => {
    const _secret = new gcp.secretmanager.Secret(secret, {
        secretId: secret,
        replication:{
            auto: {}
        },
    });
    // @ts-ignore
    const secretData = secrets[secret];
    const _secretVersion = new gcp.secretmanager.SecretVersion(secret, {
        secret: pulumi.interpolate`${_secret.id}`,
        secretData: secretData,
    }, {dependsOn: [_secret]});
    new gcp.secretmanager.SecretIamMember(`${secret}-access`, {
        secretId: secret,
        role: "roles/secretmanager.secretAccessor",
        member: "serviceAccount:service-1094805904049@gcp-sa-cloudbuild.iam.gserviceaccount.com",
    }, {dependsOn: [_secretVersion]});
    new gcp.secretmanager.SecretIamMember(`${secret}-compute-access`, {
        secretId: secret,
        role: "roles/secretmanager.secretAccessor",
        member: "serviceAccount:1094805904049-compute@developer.gserviceaccount.com",
    }, {dependsOn: [_secretVersion]});
    return _secret;
})

export const nudgenestSecrets = nudgenestSecretsArray.map((secret_)=>{
    return pulumi.interpolate`secret: ${secret_.name}`;
});

// ============================================
// Google Cloud Pub/Sub Resources
// ============================================

// Use existing service account (pulumi-deploys)
const existingServiceAccountEmail = "pulumi-deploys@nudgenest.iam.gserviceaccount.com";

// Create Pub/Sub topic for messaging
const messagingTopic = new gcp.pubsub.Topic("nudgenest-messaging", {
    name: "nudgenest-messaging",
    messageStoragePolicy: {
        allowedPersistenceRegions: [config.get("region") || "europe-west1"],
    },
    labels: {
        environment: "production",
        service: "nudgenest-backend",
        purpose: "email-notifications"
    },
});

// Grant Pub/Sub Publisher role to existing service account
const pubsubPublisherBinding = new gcp.projects.IAMMember("pubsub-publisher-role", {
    project: "nudgenest",
    role: "roles/pubsub.publisher",
    member: `serviceAccount:${existingServiceAccountEmail}`,
});

// Grant Pub/Sub Subscriber role to existing service account
const pubsubSubscriberBinding = new gcp.projects.IAMMember("pubsub-subscriber-role", {
    project: "nudgenest",
    role: "roles/pubsub.subscriber",
    member: `serviceAccount:${existingServiceAccountEmail}`,
});

// Grant Pub/Sub Viewer role to existing service account (for monitoring)
const pubsubViewerBinding = new gcp.projects.IAMMember("pubsub-viewer-role", {
    project: "nudgenest",
    role: "roles/pubsub.viewer",
    member: `serviceAccount:${existingServiceAccountEmail}`,
});

// Create PULL subscription (used for both dev and production)
const messagingSubscription = new gcp.pubsub.Subscription("nudgenest-messaging-pull", {
    name: "nudgenest-messaging-pull",
    topic: messagingTopic.name,
    ackDeadlineSeconds: 60,
    messageRetentionDuration: "604800s", // 7 days
    retryPolicy: {
        minimumBackoff: "10s",
        maximumBackoff: "600s",
    },
    expirationPolicy: {
        ttl: "", // Never expire
    },
    labels: {
        environment: "all",
        service: "nudgenest-backend",
        type: "pull"
    },
}, { dependsOn: [messagingTopic] });

// ============================================
// GDPR Compliance Pub/Sub Topic
// Shopify publishes all three mandatory compliance webhooks here directly.
// URI in shopify.app.toml: pubsub://nudgenest:nudgenest-compliance
// ============================================

const complianceTopic = new gcp.pubsub.Topic("nudgenest-compliance", {
    name: "nudgenest-compliance",
    messageStoragePolicy: {
        allowedPersistenceRegions: [config.get("region") || "europe-west1"],
    },
    labels: {
        environment: "production",
        service: "nudgenest-backend",
        purpose: "gdpr-compliance",
    },
});

// Pull subscription — backend complianceConsumer plugin listens here
const complianceSubscription = new gcp.pubsub.Subscription("nudgenest-compliance-pull", {
    name: "nudgenest-compliance-pull",
    topic: complianceTopic.name,
    ackDeadlineSeconds: 60,
    messageRetentionDuration: "2592000s", // 30 days — matches GDPR response deadline
    retryPolicy: {
        minimumBackoff: "60s",
        maximumBackoff: "600s", // GCP max is 600s (10 minutes)
    },
    expirationPolicy: {
        ttl: "", // Never expire
    },
    labels: {
        environment: "all",
        service: "nudgenest-backend",
        purpose: "gdpr-compliance",
    },
}, { dependsOn: [complianceTopic] });

// Grant Shopify's Pub/Sub service account publisher access on the compliance topic.
// Shopify uses GCP's Cloud Pub/Sub service agent to publish webhook payloads.
// If this binding needs updating, check: https://shopify.dev/docs/apps/build/compliance/privacy-law-compliance
const shopifyCompliancePublisher = new gcp.pubsub.TopicIAMMember("shopify-compliance-publisher", {
    topic: complianceTopic.name,
    role: "roles/pubsub.publisher",
    member: "serviceAccount:cloud-pubsub@system.gserviceaccount.com",
}, { dependsOn: [complianceTopic] });

// Also grant our own service account subscriber access on the compliance subscription
const complianceSubscriberBinding = new gcp.projects.IAMMember("compliance-subscriber-role", {
    project: "nudgenest",
    role: "roles/pubsub.subscriber",
    member: `serviceAccount:${existingServiceAccountEmail}`,
});

// Export Pub/Sub resources
export const pubsubTopicName = messagingTopic.name;
export const pubsubTopicId = messagingTopic.id;
export const pubsubSubscriptionName = messagingSubscription.name;
export const pubsubServiceAccountEmail = existingServiceAccountEmail;
export const complianceTopicName = complianceTopic.name;
export const complianceSubscriptionName = complianceSubscription.name;

// ============================================
// Google Cloud Storage for Media Uploads
// ============================================

// Create GCS bucket for media storage
const mediaBucket = new gcp.storage.Bucket("nudgenest-media", {
    name: "nudgenest-media",
    location: config.get("region") || "europe-west1",
    storageClass: "STANDARD",
    uniformBucketLevelAccess: true,
    publicAccessPrevention: "inherited", // Allow public access
    cors: [{
        maxAgeSeconds: 3600,
        methods: ["GET", "HEAD", "PUT", "POST", "DELETE"],
        origins: ["*"],
        responseHeaders: ["*"],
    }],
    labels: {
        environment: "production",
        service: "nudgenest-backend",
        purpose: "media-storage"
    },
});

// Make bucket publicly readable (for uploaded images/videos)
const bucketIamBinding = new gcp.storage.BucketIAMBinding("media-bucket-public-access", {
    bucket: mediaBucket.name,
    role: "roles/storage.objectViewer",
    members: ["allUsers"],
}, { dependsOn: [mediaBucket] });

// Grant storage admin role to service account for uploads/deletes
const storageAdminBinding = new gcp.projects.IAMMember("storage-admin-role", {
    project: "nudgenest",
    role: "roles/storage.objectAdmin",
    member: `serviceAccount:${existingServiceAccountEmail}`,
});

// Export GCS resources
export const gcsBucketName = mediaBucket.name;
export const gcsBucketUrl = pulumi.interpolate`https://storage.googleapis.com/${mediaBucket.name}`;

// ============================================
// CI/CD Pipelines for Monorepo
// ============================================

// Backend Artifact Registry
const repo = new gcp.artifactregistry.Repository('nudgenest-service', {
    location: config.get("region"),
    repositoryId: "nudgenest-backend-service",
    format: "DOCKER",
    description: "Repository for nudgenest backend service",
    dockerConfig: {
        immutableTags: false,
    },
    mode: "STANDARD_REPOSITORY",
})

// Frontend (Review UI) Artifact Registry
const fe_repo = new gcp.artifactregistry.Repository('nudgenest-fe-service', {
    location: config.get("region"),
    repositoryId: "nudgenest-fe-service",
    format: "DOCKER",
    description: "Repository for nudgenest frontend service",
    dockerConfig: {
        immutableTags: false,
    },
    mode: "STANDARD_REPOSITORY",
})

// Landing Page Artifact Registry
const landing_repo = new gcp.artifactregistry.Repository('nudgenest-landing-service', {
    location: config.get("region"),
    repositoryId: "nudgenest-landing-service",
    format: "DOCKER",
    description: "Repository for nudgenest landing page",
    dockerConfig: {
        immutableTags: false,
    },
    mode: "STANDARD_REPOSITORY",
})

// Single Cloud Build connection to monorepo
const monorepo_connection = new gcp.cloudbuildv2.Connection('monorepo-connection', {
    location: config.get("region") as string,
    name: 'nudgenest-monorepo-conn',
    githubConfig: {
        appInstallationId: Number(config.get("GITHUB_APP_INSTALLER_ID")),
        authorizerCredential: {
            oauthTokenSecretVersion: "projects/1094805904049/secrets/GITHUB_TOKEN/versions/latest"
        },
    }
}, {
    dependsOn: nudgenestSecretsArray,
    // ignoreChanges: Cloud Build v2 GitHub connections require a GitHub OAuth App token
    // (not a PAT) for authorizerCredential. Our GITHUB_TOKEN is a PAT, which is
    // sufficient for build triggers but cannot authorize GitHub App installations
    // (returns "user token does not have access to installations").
    // The connection itself is healthy and builds fire correctly via the GitHub App
    // installation — we just prevent Pulumi from attempting to re-apply githubConfig
    // on every `pulumi up`, which would fail with 401.
    ignoreChanges: ["githubConfig"],
})

// Link Cloud Build connection to monorepo
const monorepo_connection_repo = new gcp.cloudbuildv2.Repository('monorepo-connection-repo',{
    location: config.get("region"),
    name: 'nudgenest-monorepo-repo',
    parentConnection: pulumi.interpolate`${monorepo_connection.id}`,
    remoteUri: config.get("GITHUB_URL") as string, // This should now point to the monorepo
}, {dependsOn: [monorepo_connection]})

// Backend Build Trigger (triggers on changes to nudgenest/** directory)
const backend_connection_trigger = new gcp.cloudbuild.Trigger("backend_build_trigger", {
    location: config.get("region"),
    name: 'nudgenest-backend-trigger',
    description: "Deploys Hapi.js backend (Cloud Run) on push to test branch",
    filename: "nudgenest/cloudbuild.yaml", // Path in monorepo
    project: "nudgenest",
    repositoryEventConfig: {
        repository: monorepo_connection_repo.id,
        push: {
            branch: "^test$",
        },
    },
    includedFiles: ["nudgenest/**"], // Only trigger on backend changes
    serviceAccount: "projects/nudgenest/serviceAccounts/pulumi-deploys@nudgenest.iam.gserviceaccount.com",
}, {dependsOn: [monorepo_connection_repo]})

// Frontend Build Trigger (triggers on changes to review-ui/** directory)
const fe_connection_trigger = new gcp.cloudbuild.Trigger("frontend_build_trigger", {
    location: config.get("region"),
    name: 'nudgenest-fe-trigger',
    description: "Deploys Review UI (React/Vite, Cloud Run) on push to test branch",
    filename: "review-ui/cloudbuild.yaml", // Path in monorepo
    project: "nudgenest",
    repositoryEventConfig: {
        repository: monorepo_connection_repo.id,
        push: {
            branch: "^test$",
        },
    },
    includedFiles: ["review-ui/**"], // Only trigger on frontend changes
    serviceAccount: "projects/nudgenest/serviceAccounts/pulumi-deploys@nudgenest.iam.gserviceaccount.com",
}, {dependsOn: [monorepo_connection_repo]})

// Landing Page Build Trigger (triggers on changes to nudge-nest-landing/** directory)
const landing_connection_trigger = new gcp.cloudbuild.Trigger("landing_build_trigger", {
    location: config.get("region"),
    name: 'nudgenest-landing-trigger',
    description: "Deploys landing page (nginx static, Cloud Run) on push to test branch",
    filename: "nudge-nest-landing/cloudbuild.yaml", // Path in monorepo
    project: "nudgenest",
    repositoryEventConfig: {
        repository: monorepo_connection_repo.id,
        push: {
            branch: "^test$",
        },
    },
    includedFiles: ["nudge-nest-landing/**"], // Only trigger on landing page changes
    serviceAccount: "projects/nudgenest/serviceAccounts/pulumi-deploys@nudgenest.iam.gserviceaccount.com",
}, {dependsOn: [monorepo_connection_repo, landing_repo]})

// Shopify App Artifact Registry
const shopify_repo = new gcp.artifactregistry.Repository('nudgenest-shopify-service', {
    location: config.get("region"),
    repositoryId: "nudgenest-shopify-service",
    format: "DOCKER",
    description: "Repository for NudgeNest Shopify app (Remix)",
    dockerConfig: {
        immutableTags: false,
    },
    mode: "STANDARD_REPOSITORY",
})

// ============================================
// Shopify App Secrets
// Set values via: pulumi config set --secret <key> <value>
// ============================================
const shopifyAppSecrets = {
    SHOPIFY_APP_API_KEY:       config.get("SHOPIFY_APP_API_KEY"),
    SHOPIFY_APP_API_SECRET:    config.get("SHOPIFY_APP_API_SECRET"),
    SHOPIFY_APP_URL:           config.get("SHOPIFY_APP_URL") || "https://placeholder.run.app", // updated after first deploy
    SHOPIFY_APP_DATABASE_URL:  config.get("SHOPIFY_APP_DATABASE_URL"), // CockroachDB Serverless connection string
    SHOPIFY_APP_SCOPES:        config.get("SHOPIFY_APP_SCOPES") || "read_products,read_orders,read_customers",
    NUDGENEST_BACKEND_URL:     config.get("NUDGENEST_BACKEND_URL"),
};

const shopifyAppSecretsArray = Object.keys(shopifyAppSecrets).map((key) => {
    const _secret = new gcp.secretmanager.Secret(key, {
        secretId: key,
        replication: { auto: {} },
    });
    // @ts-ignore
    const secretData = shopifyAppSecrets[key];
    const _secretVersion = new gcp.secretmanager.SecretVersion(key, {
        secret: pulumi.interpolate`${_secret.id}`,
        secretData: secretData,
    }, { dependsOn: [_secret] });
    new gcp.secretmanager.SecretIamMember(`${key}-access`, {
        secretId: key,
        role: "roles/secretmanager.secretAccessor",
        member: "serviceAccount:service-1094805904049@gcp-sa-cloudbuild.iam.gserviceaccount.com",
    }, { dependsOn: [_secretVersion] });
    new gcp.secretmanager.SecretIamMember(`${key}-compute-access`, {
        secretId: key,
        role: "roles/secretmanager.secretAccessor",
        member: "serviceAccount:1094805904049-compute@developer.gserviceaccount.com",
    }, { dependsOn: [_secretVersion] });
    return _secret;
});

// ============================================
// Production Secrets — Backend, Review UI, Landing Page
// Set values via: pulumi config set --secret <key> <value>
// ============================================
const remainingProdSecrets = {
    DATABASE_URL_PROD:          config.get("DATABASE_URL_PROD"),
    REVIEW_UI_BASE_URL_PROD:    config.get("REVIEW_UI_BASE_URL_PROD"),
    VITE_APP_BACKEND_HOST_PROD: config.get("VITE_APP_BACKEND_HOST_PROD"),
    VITE_APP_REVIEW_UI_URL_PROD: config.get("VITE_APP_REVIEW_UI_URL_PROD"),
};

const remainingProdSecretsArray = Object.keys(remainingProdSecrets).map((key) => {
    const _secret = new gcp.secretmanager.Secret(key, {
        secretId: key,
        replication: { auto: {} },
    });
    // @ts-ignore
    const secretData = remainingProdSecrets[key];
    const _secretVersion = new gcp.secretmanager.SecretVersion(key, {
        secret: pulumi.interpolate`${_secret.id}`,
        secretData: secretData,
    }, { dependsOn: [_secret] });
    new gcp.secretmanager.SecretIamMember(`${key}-access`, {
        secretId: key,
        role: "roles/secretmanager.secretAccessor",
        member: "serviceAccount:service-1094805904049@gcp-sa-cloudbuild.iam.gserviceaccount.com",
    }, { dependsOn: [_secretVersion] });
    new gcp.secretmanager.SecretIamMember(`${key}-compute-access`, {
        secretId: key,
        role: "roles/secretmanager.secretAccessor",
        member: "serviceAccount:1094805904049-compute@developer.gserviceaccount.com",
    }, { dependsOn: [_secretVersion] });
    return _secret;
});

// ============================================
// Shopify App Production Secrets
// Set values via: pulumi config set --secret <key> <value>
// ============================================
const shopifyAppProdSecrets = {
    SHOPIFY_APP_API_KEY_PROD:      config.get("SHOPIFY_APP_API_KEY_PROD"),
    SHOPIFY_APP_API_SECRET_PROD:   config.get("SHOPIFY_APP_API_SECRET_PROD"),
    SHOPIFY_APP_URL_PROD:          config.get("SHOPIFY_APP_URL_PROD") || "https://placeholder.run.app",
    SHOPIFY_APP_DATABASE_URL_PROD: config.get("SHOPIFY_APP_DATABASE_URL_PROD"),
    SHOPIFY_APP_SCOPES_PROD:       config.get("SHOPIFY_APP_SCOPES_PROD") || "read_products,read_orders,read_customers",
    NUDGENEST_BACKEND_URL_PROD:    config.get("NUDGENEST_BACKEND_URL_PROD"),
};

const shopifyAppProdSecretsArray = Object.keys(shopifyAppProdSecrets).map((key) => {
    const _secret = new gcp.secretmanager.Secret(key, {
        secretId: key,
        replication: { auto: {} },
    });
    // @ts-ignore
    const secretData = shopifyAppProdSecrets[key];
    const _secretVersion = new gcp.secretmanager.SecretVersion(key, {
        secret: pulumi.interpolate`${_secret.id}`,
        secretData: secretData,
    }, { dependsOn: [_secret] });
    new gcp.secretmanager.SecretIamMember(`${key}-access`, {
        secretId: key,
        role: "roles/secretmanager.secretAccessor",
        member: "serviceAccount:service-1094805904049@gcp-sa-cloudbuild.iam.gserviceaccount.com",
    }, { dependsOn: [_secretVersion] });
    new gcp.secretmanager.SecretIamMember(`${key}-compute-access`, {
        secretId: key,
        role: "roles/secretmanager.secretAccessor",
        member: "serviceAccount:1094805904049-compute@developer.gserviceaccount.com",
    }, { dependsOn: [_secretVersion] });
    return _secret;
});

// Shopify App Cloud Build Trigger
const shopify_connection_trigger = new gcp.cloudbuild.Trigger("shopify_build_trigger", {
    location: config.get("region"),
    name: 'nudgenest-shopify-trigger',
    description: "Deploys NudgeNest Shopify app (Remix, Cloud Run) on push to test branch",
    filename: "nudgenest-shpfy-app/cloudbuild.yaml",
    project: "nudgenest",
    repositoryEventConfig: {
        repository: monorepo_connection_repo.id,
        push: {
            branch: "^test$",
        },
    },
    includedFiles: ["nudgenest-shpfy-app/**"],
    serviceAccount: "projects/nudgenest/serviceAccounts/pulumi-deploys@nudgenest.iam.gserviceaccount.com",
}, { dependsOn: [monorepo_connection_repo, shopify_repo, ...shopifyAppSecretsArray] })

// Backend Production Cloud Build Trigger
const backend_prod_connection_trigger = new gcp.cloudbuild.Trigger("backend_prod_build_trigger", {
    location: config.get("region"),
    name: 'nudgenest-backend-prod-trigger',
    description: "Deploys NudgeNest backend to production (Cloud Run) on push to main branch",
    filename: "nudgenest/cloudbuild.prod.yaml",
    project: "nudgenest",
    repositoryEventConfig: {
        repository: monorepo_connection_repo.id,
        push: { branch: "^master$" },
    },
    includedFiles: ["nudgenest/**"],
    serviceAccount: "projects/nudgenest/serviceAccounts/pulumi-deploys@nudgenest.iam.gserviceaccount.com",
}, { dependsOn: [monorepo_connection_repo, repo, ...remainingProdSecretsArray] })

// Review UI Production Cloud Build Trigger
const fe_prod_connection_trigger = new gcp.cloudbuild.Trigger("fe_prod_build_trigger", {
    location: config.get("region"),
    name: 'nudgenest-fe-prod-trigger',
    description: "Deploys NudgeNest Review UI to production (Cloud Run) on push to main branch",
    filename: "review-ui/cloudbuild.prod.yaml",
    project: "nudgenest",
    repositoryEventConfig: {
        repository: monorepo_connection_repo.id,
        push: { branch: "^master$" },
    },
    includedFiles: ["review-ui/**"],
    serviceAccount: "projects/nudgenest/serviceAccounts/pulumi-deploys@nudgenest.iam.gserviceaccount.com",
}, { dependsOn: [monorepo_connection_repo, fe_repo, ...remainingProdSecretsArray] })

// Landing Page Production Cloud Build Trigger
const landing_prod_connection_trigger = new gcp.cloudbuild.Trigger("landing_prod_build_trigger", {
    location: config.get("region"),
    name: 'nudgenest-landing-prod-trigger',
    description: "Deploys NudgeNest landing page to production (Cloud Run) on push to main branch",
    filename: "nudge-nest-landing/cloudbuild.prod.yaml",
    project: "nudgenest",
    repositoryEventConfig: {
        repository: monorepo_connection_repo.id,
        push: { branch: "^master$" },
    },
    includedFiles: ["nudge-nest-landing/**"],
    serviceAccount: "projects/nudgenest/serviceAccounts/pulumi-deploys@nudgenest.iam.gserviceaccount.com",
}, { dependsOn: [monorepo_connection_repo, landing_repo, ...remainingProdSecretsArray] })

// Shopify App Production Cloud Build Trigger (deploys on push to main)
const shopify_prod_connection_trigger = new gcp.cloudbuild.Trigger("shopify_prod_build_trigger", {
    location: config.get("region"),
    name: 'nudgenest-shopify-prod-trigger',
    description: "Deploys NudgeNest Shopify app to production (Cloud Run) on push to main branch",
    filename: "nudgenest-shpfy-app/cloudbuild.prod.yaml",
    project: "nudgenest",
    repositoryEventConfig: {
        repository: monorepo_connection_repo.id,
        push: {
            branch: "^master$",
        },
    },
    includedFiles: ["nudgenest-shpfy-app/**"],
    serviceAccount: "projects/nudgenest/serviceAccounts/pulumi-deploys@nudgenest.iam.gserviceaccount.com",
}, { dependsOn: [monorepo_connection_repo, shopify_repo, ...shopifyAppProdSecretsArray] })

// Export CI/CD resources
export const repoName = repo.name;
export const feRepoName = fe_repo.name;
export const landingRepoName = landing_repo.name;
export const shopifyRepoName = shopify_repo.name;
export const monorepoConnection = monorepo_connection.name;
export const monorepoConnectionRepo = monorepo_connection_repo.name;
export const backendConnectionTrigger = backend_connection_trigger.name;
export const feConnectionTrigger = fe_connection_trigger.name;
export const landingConnectionTrigger = landing_connection_trigger.name;
export const shopifyConnectionTrigger = shopify_connection_trigger.name;
export const shopifyProdConnectionTrigger = shopify_prod_connection_trigger.name;
export const backendProdConnectionTrigger = backend_prod_connection_trigger.name;
export const feProdConnectionTrigger = fe_prod_connection_trigger.name;
export const landingProdConnectionTrigger = landing_prod_connection_trigger.name;

