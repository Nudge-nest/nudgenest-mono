import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";

const config = new pulumi.Config();

const secrets = {
    RABBITMQ_URL_AWS: config.get("BACKEND_RABBITMQ_URL_AWS"),
    SENDGRID_API_KEY: config.get("BACKEND_SENDGRID_API_KEY"),
    DATABASE_URL: config.get("BACKEND_DATABASE_URL"),
    GOOGLE_APP_PASSWORD: config.get("BACKEND_GOOGLE_APP_PASSWORD"),
    VITE_APP_BACKEND_HOST: config.get("VITE_APP_BACKEND_HOST"),
    APP_AWS_ACCESS_KEY: config.get("VITE_APP_AWS_ACCESS_KEY"),
    APP_AWS_SECRET_KEY: config.get("VITE_APP_AWS_SECRET_KEY"),
    APP_AWS_REGION: config.get("VITE_APP_AWS_REGION"),
    APP_AWS_BUCKET_NAME: config.get("VITE_APP_AWS_BUCKET_NAME"),
    GITHUB_TOKEN: config.get("GITHUB_TOKEN"),
    GITHUB_APP_INSTALLER_ID: config.get("GITHUB_APP_INSTALLER_ID"),
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

//Backend pipelines

const repo = new gcp.artifactregistry.Repository('nudgenest-service', {
    location: config.get("region"),
    repositoryId: "nudgenest-backend-service",
    format: "DOCKER",
    description: "Respository for nudgenest backend service",
    dockerConfig: {
        immutableTags: false,
    },
    mode: "STANDARD_REPOSITORY",
})

//Create cloud build connection
const backend_connection = new gcp.cloudbuildv2.Connection('backend-connection', {
    location: config.get("region") as string,
    name: 'nudgenest-backend-conn',
    githubConfig: {
        appInstallationId: Number(config.get("GITHUB_APP_INSTALLER_ID")),
        authorizerCredential: {
            oauthTokenSecretVersion: "projects/1094805904049/secrets/GITHUB_TOKEN/versions/1"
        },
    }
}, {dependsOn: nudgenestSecretsArray})

//Link cloud build connection to repository
const backend_connection_repo = new gcp.cloudbuildv2.Repository('backend-connection-repo',{
    location: config.get("region") ,
    name: 'backend-connection-repo',
    parentConnection: pulumi.interpolate`${backend_connection.id}`,
    remoteUri: config.get("GITHUB_URL") as string,
}, {dependsOn: [backend_connection]})

//Create a clod build trigger
const backend_connection_trigger = new gcp.cloudbuild.Trigger("backend_build_trigger", {
    location: config.get("region"),
    name: 'nudgenest-trigger',
    filename: "cloudbuild.yaml",
    project: "nudgenest",
    repositoryEventConfig: {
        repository: backend_connection_repo.id,
        push: {
            branch: "^test$",
        },
    },
    serviceAccount: "projects/nudgenest/serviceAccounts/pulumi-deploys@nudgenest.iam.gserviceaccount.com",
}, {dependsOn: [backend_connection_repo]})


//Frontend pipelines

const fe_repo = new gcp.artifactregistry.Repository('nudgenest-fe-service', {
    location: config.get("region"),
    repositoryId: "nudgenest-fe-service",
    format: "DOCKER",
    description: "Respository for nudgenest frontend service",
    dockerConfig: {
        immutableTags: false,
    },
    mode: "STANDARD_REPOSITORY",
})

//Create cloud build connection
const fe_connection = new gcp.cloudbuildv2.Connection('frontend-connection', {
    location: config.get("region") as string,
    name: 'nudgenest-fe-conn',
    githubConfig: {
        appInstallationId: Number(config.get("GITHUB_APP_INSTALLER_ID")),
        authorizerCredential: {
            oauthTokenSecretVersion: "projects/1094805904049/secrets/GITHUB_TOKEN/versions/1"
        },
    }
}, {dependsOn: nudgenestSecretsArray})

//Link cloud build connection to repository
const fe_connection_repo = new gcp.cloudbuildv2.Repository('frontend-connection-repo',{
    location: config.get("region") ,
    name: 'frontend-connection-repo',
    parentConnection: pulumi.interpolate`${fe_connection.id}`,
    remoteUri: config.get("FE_GITHUB_URL") as string,
}, {dependsOn: [fe_connection]})

//Create a clod build trigger
const fe_connection_trigger = new gcp.cloudbuild.Trigger("frontend_build_trigger", {
    location: config.get("region"),
    name: 'nudgenest-fe-trigger',
    filename: "cloudbuild.yaml",
    project: "nudgenest",
    repositoryEventConfig: {
        repository: fe_connection_repo.id,
        push: {
            branch: "^test$",
        },
    },
    serviceAccount: "projects/nudgenest/serviceAccounts/pulumi-deploys@nudgenest.iam.gserviceaccount.com",
}, {dependsOn: [fe_connection_repo]})

// Export the DNS name of the bucket
export const repoName = repo.name;
export const backendConnection = backend_connection.name;
export const backendConnectionRepo = backend_connection_repo.name;
export const backendConnectionTrigger = backend_connection_trigger.name;
export const feRepoName = fe_repo.name;
export const feConnection = fe_connection.name;
export const feConnectionRepo = fe_connection_repo.name;
export const feConnectionTrigger = fe_connection_trigger.name;

