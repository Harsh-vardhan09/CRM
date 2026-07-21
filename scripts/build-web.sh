#!/bin/bash
set -euo pipefail

echo "Building crm-web Docker image..."
docker build -f docker/Dockerfile.web -t crm-web:local .

echo "✓ Successfully built crm-web:local"
echo ""
echo "Next step: ./scripts/push-web.sh [AWS_ACCOUNT_ID] [AWS_REGION] [IMAGE_TAG]"
