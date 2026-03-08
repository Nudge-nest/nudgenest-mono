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

    // CI/CD Secrets
    GITHUB_TOKEN: config.get("GITHUB_TOKEN"),
    GITHUB_APP_INSTALLER_ID: config.get("GITHUB_APP_INSTALLER_ID"),

    // Sentry Error Monitoring (GCP-deployed services only)
    SENTRY_BACKEND_DSN: config.get("SENTRY_BACKEND_DSN"),
    VITE_APP_SENTRY_FE_DSN: config.get("VITE_APP_SENTRY_FE_DSN"),
    // SENTRY_AUTH_TOKEN, SENTRY_ORG, SENTRY_PROJECT_REVIEW_UI are Sentry CLI
    // source-map upload credentials — not required for error reporting (DSNs above
    // handle that). Add via `pulumi config set --secret` when source map upload is needed.

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

// Export Pub/Sub resources
export const pubsubTopicName = messagingTopic.name;
export const pubsubTopicId = messagingTopic.id;
export const pubsubSubscriptionName = messagingSubscription.name;
export const pubsubServiceAccountEmail = existingServiceAccountEmail;

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
            oauthTokenSecretVersion: "projects/1094805904049/secrets/GITHUB_TOKEN/versions/1"
        },
    }
}, {dependsOn: nudgenestSecretsArray})

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

// Export CI/CD resources
export const repoName = repo.name;
export const feRepoName = fe_repo.name;
export const landingRepoName = landing_repo.name;
export const monorepoConnection = monorepo_connection.name;
export const monorepoConnectionRepo = monorepo_connection_repo.name;
export const backendConnectionTrigger = backend_connection_trigger.name;
export const feConnectionTrigger = fe_connection_trigger.name;
export const landingConnectionTrigger = landing_connection_trigger.name;

