# Build & Push Scripts

Automated Docker build and ECR push scripts for the three ECS microservices.

## Quick Start

### Step 1: Build locally
```bash
./scripts/build-web.sh
./scripts/build-server.sh
./scripts/build-worker.sh
```

### Step 2: Push to ECR
```bash
# Option A: Pass as CLI arguments
./scripts/push-web.sh 123456789012 us-east-1 v1.0.0

# Option B: Set as environment variables
export AWS_ACCOUNT_ID=123456789012
export AWS_REGION=us-east-1
export IMAGE_TAG=v1.0.0
./scripts/push-web.sh

# Option C: Use git short SHA (default)
AWS_ACCOUNT_ID=123456789012 AWS_REGION=us-east-1 ./scripts/push-web.sh
```

## Build Scripts

Each `build-*.sh` script:
- Builds the Docker image using `docker/Dockerfile.<app>`
- Tags it as `crm-<app>:local`
- Prints build success message

**Usage:**
```bash
./scripts/build-{web,server,worker}.sh
```

**Output:**
```
Building crm-web Docker image...
✓ Successfully built crm-web:local

Next step: ./scripts/push-web.sh [AWS_ACCOUNT_ID] [AWS_REGION] [IMAGE_TAG]
```

## Push Scripts

Each `push-*.sh` script:

1. **Validates AWS setup** — checks AWS CLI is installed and configured
2. **Verifies ECR repo exists** — confirms `crm-<app>` repository is created in AWS Console (manual step)
3. **Logs into ECR** — uses `aws ecr get-login-password`
4. **Tags image** — both `<IMAGE_TAG>` and `latest`
5. **Pushes to ECR** — uploads both tags
6. **Outputs final URIs** — prints the ECR image paths for ECS task definition

**Usage:**
```bash
./scripts/push-{web,server,worker}.sh [AWS_ACCOUNT_ID] [AWS_REGION] [IMAGE_TAG]
```

**Arguments:**
- `AWS_ACCOUNT_ID` — AWS account ID (12 digits), or set `$AWS_ACCOUNT_ID` env var
- `AWS_REGION` — AWS region (e.g. `us-east-1`), or set `$AWS_REGION` env var
- `IMAGE_TAG` — optional, defaults to git short SHA via `git rev-parse --short HEAD`

**Output:**
```
Checking if ECR repository exists: 123456789012.dkr.ecr.us-east-1.amazonaws.com/crm-web...
✓ ECR repository exists

Logging in to ECR...
✓ Successfully logged in to ECR

Tagging image...
✓ Tagged as:
  - 123456789012.dkr.ecr.us-east-1.amazonaws.com/crm-web:abc1234
  - 123456789012.dkr.ecr.us-east-1.amazonaws.com/crm-web:latest

Pushing to ECR...
✓ Pushed 123456789012.dkr.ecr.us-east-1.amazonaws.com/crm-web:abc1234
✓ Pushed 123456789012.dkr.ecr.us-east-1.amazonaws.com/crm-web:latest

==========================================
✓ Successfully pushed web image
==========================================

Image URIs (paste into ECS task definition):
  Specific tag: 123456789012.dkr.ecr.us-east-1.amazonaws.com/crm-web:abc1234
  Latest tag:   123456789012.dkr.ecr.us-east-1.amazonaws.com/crm-web:latest
```

## Error Handling

Scripts fail loudly with clear messages if:

- **AWS CLI not installed** → "Please install it: https://aws.amazon.com/cli/"
- **AWS credentials not configured** → "Please run: aws configure"
- **ECR repository doesn't exist** → "Please create it in the AWS Console first"

## Prerequisites

1. **AWS CLI** configured with valid credentials
   ```bash
   aws configure
   aws sts get-caller-identity  # verify
   ```

2. **ECR repositories** manually created in AWS Console
   - `crm-web`
   - `crm-server`
   - `crm-worker`
   
   (Scripts will not auto-create repos — this is a manual setup step)

3. **Docker** installed and running
   ```bash
   docker --version
   ```

## Environment Variables

Scripts can read from or use as defaults:

| Variable | Default | Purpose |
|----------|---------|---------|
| `AWS_ACCOUNT_ID` | (required) | AWS account ID |
| `AWS_REGION` | (required) | AWS region |
| `IMAGE_TAG` | git short SHA | Docker image tag |

## Example: Full CI/CD Pipeline

```bash
#!/bin/bash
set -e

AWS_ACCOUNT_ID="123456789012"
AWS_REGION="us-east-1"
IMAGE_TAG=$(git describe --tags --always)

echo "Building images..."
./scripts/build-web.sh
./scripts/build-server.sh
./scripts/build-worker.sh

echo "Pushing to ECR..."
AWS_ACCOUNT_ID=$AWS_ACCOUNT_ID AWS_REGION=$AWS_REGION IMAGE_TAG=$IMAGE_TAG \
  ./scripts/push-web.sh

AWS_ACCOUNT_ID=$AWS_ACCOUNT_ID AWS_REGION=$AWS_REGION IMAGE_TAG=$IMAGE_TAG \
  ./scripts/push-server.sh

AWS_ACCOUNT_ID=$AWS_ACCOUNT_ID AWS_REGION=$AWS_REGION IMAGE_TAG=$IMAGE_TAG \
  ./scripts/push-worker.sh

echo "✓ All images pushed successfully"
```
