#!/bin/bash
set -euo pipefail

APP="server"
IMAGE_NAME="crm-${APP}"
LOCAL_TAG="${IMAGE_NAME}:local"

# Parse arguments or use env vars
AWS_ACCOUNT_ID="${1:-${AWS_ACCOUNT_ID:-}}"
AWS_REGION="${2:-${AWS_REGION:-}}"
IMAGE_TAG="${3:-$(git rev-parse --short HEAD)}"

# Validate required arguments
if [[ -z "$AWS_ACCOUNT_ID" ]]; then
  echo "❌ Error: AWS_ACCOUNT_ID not provided"
  echo "Usage: $0 <AWS_ACCOUNT_ID> <AWS_REGION> [IMAGE_TAG]"
  echo "   or: AWS_ACCOUNT_ID=123456789 AWS_REGION=us-east-1 $0"
  exit 1
fi

if [[ -z "$AWS_REGION" ]]; then
  echo "❌ Error: AWS_REGION not provided"
  echo "Usage: $0 <AWS_ACCOUNT_ID> <AWS_REGION> [IMAGE_TAG]"
  echo "   or: AWS_ACCOUNT_ID=123456789 AWS_REGION=us-east-1 $0"
  exit 1
fi

# Verify AWS CLI is configured
if ! command -v aws &> /dev/null; then
  echo "❌ Error: AWS CLI not found. Please install it: https://aws.amazon.com/cli/"
  exit 1
fi

# Verify AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
  echo "❌ Error: AWS credentials not configured or invalid"
  echo "Please run: aws configure"
  exit 1
fi

ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
ECR_REPO="${ECR_REGISTRY}/${IMAGE_NAME}"

# Verify ECR repository exists
echo "Checking if ECR repository exists: ${ECR_REPO}..."
if ! aws ecr describe-repositories \
  --repository-names "${IMAGE_NAME}" \
  --region "${AWS_REGION}" &> /dev/null; then
  echo "❌ Error: ECR repository '${IMAGE_NAME}' does not exist in ${AWS_REGION}"
  echo "Please create it in the AWS Console first (ECR > Repositories > Create Repository)"
  exit 1
fi

echo "✓ ECR repository exists"
echo ""

# Login to ECR
echo "Logging in to ECR..."
aws ecr get-login-password --region "${AWS_REGION}" | \
  docker login --username AWS --password-stdin "${ECR_REGISTRY}"
echo "✓ Successfully logged in to ECR"
echo ""

# Tag image
echo "Tagging image..."
docker tag "${LOCAL_TAG}" "${ECR_REPO}:${IMAGE_TAG}"
docker tag "${LOCAL_TAG}" "${ECR_REPO}:latest"
echo "✓ Tagged as:"
echo "  - ${ECR_REPO}:${IMAGE_TAG}"
echo "  - ${ECR_REPO}:latest"
echo ""

# Push images
echo "Pushing to ECR..."
docker push "${ECR_REPO}:${IMAGE_TAG}"
echo "✓ Pushed ${ECR_REPO}:${IMAGE_TAG}"

docker push "${ECR_REPO}:latest"
echo "✓ Pushed ${ECR_REPO}:latest"
echo ""

# Print final URI for ECS console
echo "=========================================="
echo "✓ Successfully pushed ${APP} image"
echo "=========================================="
echo ""
echo "Image URIs (paste into ECS task definition):"
echo "  Specific tag: ${ECR_REPO}:${IMAGE_TAG}"
echo "  Latest tag:   ${ECR_REPO}:latest"
echo ""
