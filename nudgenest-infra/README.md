# Nudgenest Infrastructure (Pulumi)

Infrastructure as Code for Nudgenest using Pulumi and Google Cloud Platform.

## 📋 Overview

This Pulumi project manages all infrastructure for the Nudgenest application including:

- **Artifact Registry:** Docker image repositories for backend and frontend
- **Cloud Build:** CI/CD pipelines with GitHub integration
- **Pub/Sub:** Message queue for email notifications (replaces RabbitMQ)
- **Service Accounts:** IAM and authentication
- **Secret Manager:** Secure configuration storage

## 🏗️ Resources Managed

### Cloud Build & Deployment
- Artifact Registry repositories (backend & frontend)
- Cloud Build connections to GitHub
- Build triggers for automatic deployment
- Service accounts for build automation

### Messaging Infrastructure (New!)
- **Pub/Sub Topic:** `nudgenest-messaging`
- **Pub/Sub Subscription:** `nudgenest-messaging-sub` (push)
- **Service Account:** `nudgenest-pubsub@nudgenest.iam.gserviceaccount.com`
- **IAM Roles:** Publisher, Subscriber, Viewer

### Secrets Management
- SendGrid API key
- Database URL
- AWS credentials for S3
- GitHub tokens for CI/CD

## 🚀 Quick Start

### Prerequisites

```bash
# Install Pulumi CLI
brew install pulumi  # macOS
# or visit: https://www.pulumi.com/docs/get-started/install/

# Authenticate with Google Cloud
gcloud auth login
gcloud config set project nudgenest

# Install dependencies
pnpm install
```

### Deploy Infrastructure

```bash
# Preview changes
pulumi preview

# Deploy all resources
pulumi up

# Get service account key
pulumi stack output pubsubServiceAccountKeyPrivate --show-secrets | base64 -d > nudgenest-pubsub-key.json
```

## 📖 Documentation

- **[DEPLOY.md](./DEPLOY.md)** - Quick deployment guide (5 minutes)
- **[PUBSUB_INFRASTRUCTURE.md](./PUBSUB_INFRASTRUCTURE.md)** - Detailed Pub/Sub setup and configuration
- **[Pulumi.dev.yaml](./Pulumi.dev.yaml)** - Environment configuration

## 🔧 Configuration

### Required Config Values

```bash
pulumi config set gcp:project nudgenest
pulumi config set region europe-west1
pulumi config set BACKEND_SENDGRID_API_KEY <key> --secret
pulumi config set BACKEND_DATABASE_URL <url> --secret
```

### Optional Config Values

```bash
# Custom Pub/Sub webhook URL
pulumi config set BACKEND_PUBSUB_WEBHOOK_URL https://custom-url.run.app/api/v1/pubsub-webhook
```

## 📊 Stack Outputs

```bash
# List all outputs
pulumi stack output

# Get specific outputs
pulumi stack output pubsubTopicName
pulumi stack output pubsubSubscriptionName
pulumi stack output pubsubServiceAccountEmail

# Get secrets (requires --show-secrets)
pulumi stack output pubsubServiceAccountKeyPrivate --show-secrets
```

## 🏃 Deployment Workflow

1. **Code pushed to GitHub** (test branch)
2. **Cloud Build triggered** automatically
3. **Docker image built** and pushed to Artifact Registry
4. **Cloud Run deployed** with new image
5. **Pub/Sub subscription** sends messages to Cloud Run endpoint

## 🔍 Resource Details

### Pub/Sub Topic: `nudgenest-messaging`
- **Purpose:** Central message queue for email notifications
- **Region:** europe-west1
- **Message Retention:** 7 days
- **Use Cases:**
  - New review requests
  - Review reminders
  - Merchant notifications
  - Welcome emails

### Pub/Sub Subscription: `nudgenest-messaging-sub`
- **Type:** Push subscription
- **Endpoint:** `/api/v1/pubsub-webhook` on Cloud Run
- **ACK Deadline:** 60 seconds
- **Retry Policy:** Exponential backoff (10s to 600s)
- **Authentication:** OIDC token

### Service Account: `nudgenest-pubsub`
- **Email:** `nudgenest-pubsub@nudgenest.iam.gserviceaccount.com`
- **Roles:**
  - `roles/pubsub.publisher` - Publish messages
  - `roles/pubsub.subscriber` - Receive messages
  - `roles/pubsub.viewer` - View metrics

## 💰 Cost Overview

### Current Infrastructure Costs

| Resource | Monthly Cost | Notes |
|----------|--------------|-------|
| Pub/Sub | $0 | Within free tier (10GB/month) |
| Artifact Registry | ~$0.10 | Per GB storage |
| Cloud Build | $0 | 120 builds/day free |
| Secret Manager | ~$0.60 | $0.06/secret/month |
| **Total** | **~$0.70/month** | Was $50-100 with RabbitMQ! |

**Annual Savings:** ~$600-1,200 🎉

## 🧪 Testing

### Test Pub/Sub Setup

```bash
# Publish test message
gcloud pubsub topics publish nudgenest-messaging \
    --message='{"eventType":"new-review","payload":{"content":{"userName":"Test","email":"test@example.com","reviewId":"123","line_items":[],"order_number":"TEST","currency":"USD"},"context":{"receiver":["reviewer"]}}}'

# Check subscription
gcloud pubsub subscriptions describe nudgenest-messaging-sub

# View logs
gcloud logging read "resource.type=pubsub_subscription" --limit 50
```

## 📈 Monitoring

### Cloud Console Links

- **Pub/Sub Topics:** https://console.cloud.google.com/cloudpubsub/topic/list?project=nudgenest
- **Subscriptions:** https://console.cloud.google.com/cloudpubsub/subscription/list?project=nudgenest
- **Cloud Build:** https://console.cloud.google.com/cloud-build/builds?project=nudgenest
- **Artifact Registry:** https://console.cloud.google.com/artifacts?project=nudgenest

### Useful Commands

```bash
# View Pulumi state
pulumi stack

# View deployment history
pulumi history

# Refresh state from GCP
pulumi refresh

# View resource details
pulumi stack output --json
```

## 🔄 Updates and Maintenance

### Update Pub/Sub Endpoint

```bash
pulumi config set BACKEND_PUBSUB_WEBHOOK_URL https://new-url.run.app/api/v1/pubsub-webhook
pulumi up
```

### Update Configuration

```bash
# Update secret
pulumi config set BACKEND_SENDGRID_API_KEY new_key --secret

# Apply changes
pulumi up
```

### Rotate Service Account Key

```bash
# Create new key via Pulumi (triggers rotation)
pulumi destroy --target gcp:serviceaccount/key:Key:nudgenest-pubsub-key
pulumi up

# Get new key
pulumi stack output pubsubServiceAccountKeyPrivate --show-secrets | base64 -d > new-key.json
```

## 🆘 Troubleshooting

### Common Issues

#### 1. "Resource already exists"
**Solution:** Import existing resources
```bash
pulumi import gcp:pubsub/topic:Topic nudgenest-messaging projects/nudgenest/topics/nudgenest-messaging
```

#### 2. "Permission denied"
**Solution:** Grant permissions to Pulumi service account
```bash
gcloud projects add-iam-policy-binding nudgenest \
    --member="serviceAccount:pulumi-deploys@nudgenest.iam.gserviceaccount.com" \
    --role="roles/editor"
```

#### 3. "Service account key not decoding"
**Solution:** Use file output
```bash
pulumi stack output pubsubServiceAccountKeyPrivate --show-secrets > key-base64.txt
base64 -d key-base64.txt > nudgenest-pubsub-key.json
```

### Getting Help

```bash
# View Pulumi documentation
pulumi help

# View resource documentation
pulumi help gcp:pubsub:Topic

# Check stack status
pulumi stack

# View detailed logs
pulumi up --logtostderr -v=9
```

## 🔐 Security Best Practices

1. **Never commit service account keys** - Added to `.gitignore`
2. **Use Secret Manager** - All secrets encrypted at rest
3. **Least privilege IAM** - Service accounts have minimal permissions
4. **Rotate keys regularly** - Every 90 days recommended
5. **Use OIDC tokens** - For Pub/Sub push authentication
6. **Enable audit logging** - Track all infrastructure changes

## 📝 Migration Notes

### RabbitMQ → Pub/Sub Migration

**What changed:**
- ❌ Removed: `RABBITMQ_URL_AWS` from secrets
- ✅ Added: Pub/Sub topic and subscription
- ✅ Added: Service account for Pub/Sub
- ✅ Added: IAM role bindings

**Benefits:**
- 💰 Cost savings: $600-1,200/year
- 🚀 Serverless: Auto-scales automatically
- 🔒 Better security: IAM-based auth
- 📊 Better monitoring: Cloud Console integration

## 🎯 Next Steps

1. ✅ Deploy infrastructure: `pulumi up`
2. ✅ Download service account key
3. ✅ Update application `.env`
4. ✅ Deploy application to Cloud Run
5. ✅ Test message flow
6. ✅ Monitor for 1-2 weeks
7. ✅ Delete Amazon MQ RabbitMQ instance

## 📚 Additional Resources

- [Pulumi GCP Documentation](https://www.pulumi.com/registry/packages/gcp/)
- [Google Cloud Pub/Sub Docs](https://cloud.google.com/pubsub/docs)
- [Cloud Build Documentation](https://cloud.google.com/build/docs)
- [Artifact Registry Documentation](https://cloud.google.com/artifact-registry/docs)

---

## 📦 Project Structure

```
nudgenest-infra/
├── index.ts                      # Main Pulumi program
├── package.json                  # Node.js dependencies
├── tsconfig.json                 # TypeScript configuration
├── Pulumi.yaml                   # Pulumi project config
├── Pulumi.dev.yaml              # Dev environment config
├── README.md                    # This file
├── DEPLOY.md                    # Quick deployment guide
└── PUBSUB_INFRASTRUCTURE.md     # Detailed Pub/Sub docs
```

---

**Infrastructure Status:** ✅ Production Ready

**Last Updated:** 2025-12-11

**Maintained By:** Nudgenest Team
