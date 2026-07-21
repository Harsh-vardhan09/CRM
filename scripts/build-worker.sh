#!/bin/bash
set -euo pipefail

echo "Building crm-worker Docker image..."
docker build -f docker/Dockerfile.worker -t crm-worker:local .

echo "✓ Successfully built crm-worker:local"
echo ""
echo "Next step: ./scripts/push-worker.sh [AWS_ACCOUNT_ID] [AWS_REGION] [IMAGE_TAG]"
