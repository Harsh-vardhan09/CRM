#!/bin/bash
set -euo pipefail

echo "Building crm-server Docker image..."
docker build -f docker/Dockerfile.server -t crm-server:local .

echo "✓ Successfully built crm-server:local"
echo ""
echo "Next step: ./scripts/push-server.sh [AWS_ACCOUNT_ID] [AWS_REGION] [IMAGE_TAG]"
