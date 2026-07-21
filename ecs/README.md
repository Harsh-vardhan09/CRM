# ECS Fargate Task Definitions

Fargate task definitions for the three microservices (crm-web, crm-server, crm-worker).

## Files

- `web-task-definition.json` — Next.js web app (512 CPU / 1024 MB memory)
- `server-task-definition.json` — Express API (512 CPU / 1024 MB memory)
- `worker-task-definition.json` — BullMQ workers (256 CPU / 512 MB memory)

## Placeholders to Replace

Before registering task definitions, find and replace:

| Placeholder | Example | Where |
|-------------|---------|-------|
| `<ACCOUNT_ID>` | `123456789012` | AWS account ID (12 digits) |
| `<REGION>` | `us-east-1` | AWS region |
| `<ELASTICACHE_ENDPOINT>` | `crm-redis.abc1234.ng.0001.use1.cache.amazonaws.com` | ElastiCache Redis endpoint |
| `<RDS_ENDPOINT>` | `crm-db.c1234567890ab.us-east-1.rds.amazonaws.com` | RDS PostgreSQL endpoint |

**Quick find-and-replace:**
```bash
sed -i 's/<ACCOUNT_ID>/123456789012/g' ecs/*.json
sed -i 's/<REGION>/us-east-1/g' ecs/*.json
sed -i 's/<ELASTICACHE_ENDPOINT>/crm-redis.abc1234.ng.0001.use1.cache.amazonaws.com/g' ecs/*.json
sed -i 's/<RDS_ENDPOINT>/crm-db.c1234567890ab.us-east-1.rds.amazonaws.com/g' ecs/*.json
```

## IAM Roles (REQUIRED SETUP)

### ecsTaskExecutionRole

**Purpose:** Allows ECS task to pull images from ECR and write logs to CloudWatch.

**Required permissions:**
- `ecr:GetAuthorizationToken`
- `ecr:BatchCheckLayerAvailability`
- `ecr:GetDownloadUrlForLayer`
- `ecr:BatchGetImage`
- `logs:CreateLogStream`
- `logs:PutLogEvents`
- `secretsmanager:GetSecretValue` (for secrets from Secrets Manager)

**Create via AWS Console:**
1. Go to IAM > Roles > Create Role
2. Select service: ECS (Elastic Container Service)
3. Select task type: Elastic Container Service Task
4. Attach policies:
   - `AmazonEC2ContainerServiceTaskExecutionRolePolicy` (built-in)
   - `SecretsManagerReadWrite` (for Secrets Manager access)
5. Name it: `ecsTaskExecutionRole`

**Or via CLI:**
```bash
aws iam create-role \
  --role-name ecsTaskExecutionRole \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Principal": {
          "Service": "ecs-tasks.amazonaws.com"
        },
        "Action": "sts:AssumeRole"
      }
    ]
  }'

aws iam attach-role-policy \
  --role-name ecsTaskExecutionRole \
  --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy

aws iam attach-role-policy \
  --role-name ecsTaskExecutionRole \
  --policy-arn arn:aws:iam::aws:policy/SecretsManagerReadWrite
```

### ecsTaskRole

**Purpose:** Allows running application to access AWS services (optional for v1, used by future modules).

**Minimal setup:**
1. Go to IAM > Roles > Create Role
2. Select service: ECS Task
3. Attach any application-specific policies (e.g., S3 access, DynamoDB, etc.)
4. Name it: `ecsTaskRole`

**Or via CLI:**
```bash
aws iam create-role \
  --role-name ecsTaskRole \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Principal": {
          "Service": "ecs-tasks.amazonaws.com"
        },
        "Action": "sts:AssumeRole"
      }
    ]
  }'

# Attach policies as needed (e.g., for S3, DynamoDB, etc.)
```

### CloudWatch Log Groups

Create the log groups before registering task definitions:

```bash
aws logs create-log-group --log-group-name /ecs/crm-web --region <REGION>
aws logs create-log-group --log-group-name /ecs/crm-server --region <REGION>
aws logs create-log-group --log-group-name /ecs/crm-worker --region <REGION>

# Set retention (optional, in days)
aws logs put-retention-policy --log-group-name /ecs/crm-web --retention-in-days 30 --region <REGION>
aws logs put-retention-policy --log-group-name /ecs/crm-server --retention-in-days 30 --region <REGION>
aws logs put-retention-policy --log-group-name /ecs/crm-worker --retention-in-days 30 --region <REGION>
```

## Secrets Manager Setup

Before registering task definitions, store secrets in Secrets Manager:

```bash
REGION="us-east-1"
ACCOUNT_ID="123456789012"

# Server secrets
aws secretsmanager create-secret --name crm/server/JWT_SECRET --secret-string "your-jwt-secret" --region $REGION
aws secretsmanager create-secret --name crm/server/JWT_PRIVATE_KEY --secret-string "$(cat key.pem)" --region $REGION
aws secretsmanager create-secret --name crm/server/JWT_PUBLIC_KEY --secret-string "$(cat key.pub)" --region $REGION
aws secretsmanager create-secret --name crm/server/TWILIO_ACCOUNT_SID --secret-string "ACxxxxx" --region $REGION
aws secretsmanager create-secret --name crm/server/TWILIO_AUTH_TOKEN --secret-string "xxxxx" --region $REGION
aws secretsmanager create-secret --name crm/server/RESEND_API_KEY --secret-string "re_xxxxx" --region $REGION
aws secretsmanager create-secret --name crm/server/DATABASE_URL --secret-string "postgresql://user:pass@host:5432/crm" --region $REGION
aws secretsmanager create-secret --name crm/server/POSTGRES_PASSWORD --secret-string "xxxxx" --region $REGION

# Worker secrets
aws secretsmanager create-secret --name crm/worker/TWILIO_ACCOUNT_SID --secret-string "ACxxxxx" --region $REGION
aws secretsmanager create-secret --name crm/worker/TWILIO_AUTH_TOKEN --secret-string "xxxxx" --region $REGION
aws secretsmanager create-secret --name crm/worker/RESEND_API_KEY --secret-string "re_xxxxx" --region $REGION
aws secretsmanager create-secret --name crm/worker/DATABASE_URL --secret-string "postgresql://user:pass@host:5432/crm" --region $REGION
aws secretsmanager create-secret --name crm/worker/POSTGRES_PASSWORD --secret-string "xxxxx" --region $REGION
```

## Register Task Definitions

After replacing placeholders and creating IAM roles + secrets:

```bash
# Register web task definition
aws ecs register-task-definition \
  --cli-input-json file://ecs/web-task-definition.json \
  --region <REGION>

# Register server task definition
aws ecs register-task-definition \
  --cli-input-json file://ecs/server-task-definition.json \
  --region <REGION>

# Register worker task definition
aws ecs register-task-definition \
  --cli-input-json file://ecs/worker-task-definition.json \
  --region <REGION>
```

**Or paste into AWS Console:**
1. ECS > Task Definitions > Create new task definition
2. Select Fargate launch type
3. Paste JSON content into "Container definitions" or edit via UI
4. Click "Create"

## Task Definition Details

### web-task-definition.json

- **CPU/Memory:** 512 CPU / 1024 MB (Fargate-valid: 0.25 vCPU / 512–1024 MB)
- **Port:** 3000
- **Health Check:** HTTP curl to `/` (root)
- **Environment:** NODE_ENV, NEXT_PUBLIC_API_URL
- **Secrets:** None (Next.js frontend)
- **Log Group:** `/ecs/crm-web`

### server-task-definition.json

- **CPU/Memory:** 512 CPU / 1024 MB (0.5 vCPU / 1024 MB)
- **Port:** 5000
- **Health Check:** HTTP curl to `/api/health` (from Module 5)
- **Environment:** NODE_ENV, PORT, CLIENT_URL, JWT_ALGORITHM, expiration times, emails, phone numbers, Redis/RDS endpoints
- **Secrets:** JWT_SECRET, JWT_PRIVATE_KEY, JWT_PUBLIC_KEY, TWILIO_*, RESEND_API_KEY, DATABASE_URL, POSTGRES_PASSWORD
- **Log Group:** `/ecs/crm-server`

### worker-task-definition.json

- **CPU/Memory:** 256 CPU / 512 MB (0.25 vCPU / 512 MB)
- **Port:** None (background job processor)
- **Health Check:** None (relies on ECS task exit codes and auto-restart)
- **Environment:** NODE_ENV, LEAD_FROM_EMAIL, TWILIO_*, LEAD_INACTIVITY_DAYS, Redis/RDS endpoints
- **Secrets:** TWILIO_*, RESEND_API_KEY, DATABASE_URL, POSTGRES_PASSWORD
- **Log Group:** `/ecs/crm-worker`

## Next Steps

1. **Create IAM roles** (ecsTaskExecutionRole, ecsTaskRole)
2. **Create CloudWatch log groups** (/ecs/crm-web, /ecs/crm-server, /ecs/crm-worker)
3. **Store secrets** in Secrets Manager
4. **Update placeholders** in task definition files
5. **Register task definitions** via CLI or AWS Console
6. **Create ECS cluster** (optional, may already exist)
7. **Create ECS services** (one per app, with ALB integration)
8. **Configure ALB target groups** with health check paths

## CPU/Memory Combinations (Fargate-valid)

For reference, Fargate allows these combinations:

| CPU (vCPU) | Memory Options (MB) |
|-----------|-------------------|
| 0.25      | 512, 1024, 2048 |
| 0.5       | 1024–4096 (1024 increments) |
| 1         | 2048–8192 (1024 increments) |
| 2         | 4096–16384 (1024 increments) |
| 4         | 8192–30720 (1024 increments) |

Current task definition assignments are conservative starting points; adjust based on observed metrics.

## AWS Deployment (ECS/ECR)

Follow these steps in the AWS Console to deploy the CRM to Fargate. Before starting, have ready:
- AWS Account ID (12 digits)
- AWS Region (e.g., `us-east-1`)
- Secrets (JWT keys, API keys, database password)

### 1. Create ECR Repositories

**In AWS Console: ECR > Repositories > Create Repository**

Create three repositories:
- `crm-web`
- `crm-server`
- `crm-worker`

(Default settings are fine. Note the full registry URL for each: `<ACCOUNT_ID>.dkr.ecr.<REGION>.amazonaws.com/crm-<app>`)

### 2. Build and Push Initial Images

**In your terminal (project root):**

```bash
# Build all three images locally
./scripts/build-web.sh
./scripts/build-server.sh
./scripts/build-worker.sh

# Push to ECR (replace with your account ID and region)
export AWS_ACCOUNT_ID=123456789012
export AWS_REGION=us-east-1

./scripts/push-web.sh
./scripts/push-server.sh
./scripts/push-worker.sh
```

Verify all three images now appear in ECR Console under each repository.

### 3. Create RDS PostgreSQL Database

**In AWS Console: RDS > Databases > Create Database**

- Engine: PostgreSQL 16
- DB Instance Identifier: `crm-db`
- Master username: `postgres`
- Master password: (save this, you'll need it for Secrets Manager)
- DB Instance Class: `db.t4g.micro` (free tier eligible)
- Allocated Storage: 20 GB (free tier eligible)
- VPC: Same VPC as ECS cluster (see step 7)
- Publicly accessible: **No**
- Create database.

**After creation:** Go to "Connectivity & security" and copy the **Endpoint** (e.g., `crm-db.c1234567890ab.us-east-1.rds.amazonaws.com`). Note this for DATABASE_URL.

### 4. Create ElastiCache Redis Cluster

**In AWS Console: ElastiCache > Clusters > Create**

- Cluster engine: Redis
- Cluster mode: Disabled
- Name: `crm-redis`
- Engine version: 7.x (latest)
- Node type: `cache.t4g.micro` (free tier eligible)
- Number of replicas: 0 (optional, cost savings)
- Subnet group: Default or same VPC as RDS
- Security group: Allow inbound on port 6379 from ECS tasks

**After creation:** Go to "Nodes" and copy the **Primary Endpoint** (e.g., `crm-redis.abc1234.ng.0001.use1.cache.amazonaws.com:6379`). Note this for REDIS_URL.

### 5. Store Secrets in AWS Secrets Manager

**In AWS Console: Secrets Manager > Store a new secret**

Create the following secrets (one per secret). For each, choose **Other type of secret** and paste the value:

**Server secrets:**
- Secret name: `crm/server/JWT_SECRET` → paste your JWT secret
- Secret name: `crm/server/JWT_PRIVATE_KEY` → paste your private RSA key
- Secret name: `crm/server/JWT_PUBLIC_KEY` → paste your public RSA key
- Secret name: `crm/server/TWILIO_ACCOUNT_SID` → paste your Twilio Account SID
- Secret name: `crm/server/TWILIO_AUTH_TOKEN` → paste your Twilio Auth Token
- Secret name: `crm/server/RESEND_API_KEY` → paste your Resend API key
- Secret name: `crm/server/DATABASE_URL` → paste `postgresql://postgres:PASSWORD@ENDPOINT:5432/crm` (from step 3)
- Secret name: `crm/server/POSTGRES_PASSWORD` → paste the RDS master password

**Worker secrets:**
- Secret name: `crm/worker/TWILIO_ACCOUNT_SID` → paste your Twilio Account SID
- Secret name: `crm/worker/TWILIO_AUTH_TOKEN` → paste your Twilio Auth Token
- Secret name: `crm/worker/RESEND_API_KEY` → paste your Resend API key
- Secret name: `crm/worker/DATABASE_URL` → paste `postgresql://postgres:PASSWORD@ENDPOINT:5432/crm`
- Secret name: `crm/worker/POSTGRES_PASSWORD` → paste the RDS master password

(Leave default encryption and auto-rotation off.)

### 6. Create/Confirm IAM Execution Role

**In AWS Console: IAM > Roles > Create Role** (if not already created)

Or verify existing role:
1. Go to IAM > Roles > search for `ecsTaskExecutionRole`
2. If it exists, attach policies (next steps); if not, create it.

**Create Role:**
1. Service: Elastic Container Service
2. Use case: Elastic Container Service Task
3. Attach policies:
   - `AmazonEC2ContainerServiceTaskExecutionRolePolicy` (built-in)
   - `SecretsManagerReadWrite` (or create inline policy for `secretsmanager:GetSecretValue` on `arn:aws:secretsmanager:*:*:secret:crm/*`)
   - `CloudWatchLogsFullAccess` (or inline: `logs:CreateLogStream`, `logs:PutLogEvents`)
4. Name: `ecsTaskExecutionRole`

### 7. Create CloudWatch Log Groups

**In AWS Console: CloudWatch > Logs > Log Groups > Create Log Group**

Create three log groups:
- `/ecs/crm-web`
- `/ecs/crm-server`
- `/ecs/crm-worker`

(Leave retention as default or set to 30 days.)

### 8. Create ECS Fargate Cluster

**In AWS Console: ECS > Clusters > Create Cluster**

- Cluster name: `crm-cluster`
- VPC: Default (or your preferred VPC, must match RDS + ElastiCache)
- Subnets: Select at least 2 for high availability
- Security group: Create new or use default (will configure later)
- Create cluster.

### 9. Register Task Definitions

**In AWS Console: ECS > Task Definitions > Create new task definition**

For each task definition file (`ecs/*.json`):

1. Click **Create new task definition**
2. Select **Fargate** launch type
3. Copy-paste the entire JSON from `ecs/web-task-definition.json` (or server/worker) into the task definition JSON editor
4. **Find-and-replace placeholders** in the JSON editor:
   - `<ACCOUNT_ID>` → your AWS account ID
   - `<REGION>` → your region (e.g., `us-east-1`)
   - `<ELASTICACHE_ENDPOINT>` → ElastiCache endpoint from step 4 (without `:6379`)
   - `<RDS_ENDPOINT>` → RDS endpoint from step 3
5. Click **Create** (or **Register task definition**)

Repeat for `server-task-definition.json` and `worker-task-definition.json`.

### 10. Create Application Load Balancer (ALB)

**In AWS Console: EC2 > Load Balancers > Create Load Balancer**

- Type: Application Load Balancer
- Name: `crm-alb`
- Scheme: Internet-facing
- IP address type: IPv4
- VPC: Same as ECS cluster (step 8)
- Subnets: At least 2
- Security group: Create or edit to allow:
  - Inbound: HTTP 80, HTTPS 443 (from 0.0.0.0/0)
  - Inbound: 3000 (web service)
  - Inbound: 5000 (server service)

### 11. Create ECS Services

**In AWS Console: ECS > Clusters > crm-cluster > Services > Create**

#### Service 1: crm-server

1. Launch type: Fargate
2. Task Definition: `crm-server` (latest revision)
3. Cluster: `crm-cluster`
4. Service name: `crm-server`
5. Desired count: 2 (for redundancy)
6. VPC: Same as cluster
7. Subnets: Same as cluster
8. Security group: Create or edit to allow port 5000 from ALB
9. **Load balancing:** Application Load Balancer
   - Load balancer name: `crm-alb`
   - Container to load balance: `crm-server:5000`
   - Target group: Create new
     - Name: `crm-server-tg`
     - Protocol: HTTP
     - Port: 5000
     - Health check path: `/api/health`
     - Healthy threshold: 2
     - Unhealthy threshold: 3
     - Timeout: 5s
     - Interval: 30s
10. Create service.

#### Service 2: crm-web

1. Launch type: Fargate
2. Task Definition: `crm-web` (latest revision)
3. Cluster: `crm-cluster`
4. Service name: `crm-web`
5. Desired count: 2
6. VPC: Same as cluster
7. Subnets: Same as cluster
8. Security group: Allow port 3000 from ALB
9. **Load balancing:** Application Load Balancer
   - Load balancer name: `crm-alb` (same ALB)
   - Container to load balance: `crm-web:3000`
   - Target group: Create new
     - Name: `crm-web-tg`
     - Protocol: HTTP
     - Port: 3000
     - Health check path: `/`
     - Healthy threshold: 2
     - Unhealthy threshold: 3
     - Timeout: 5s
     - Interval: 30s
10. Create service.

#### Service 3: crm-worker

1. Launch type: Fargate
2. Task Definition: `crm-worker` (latest revision)
3. Cluster: `crm-cluster`
4. Service name: `crm-worker`
5. Desired count: 1 (adjust as needed)
6. VPC: Same as cluster
7. Subnets: Same as cluster
8. Security group: Allow outbound to RDS (5432) and ElastiCache (6379)
9. **Load balancing:** None (workers don't need ALB)
10. Create service.

### 12. Configure ALB Routing Rules

**In AWS Console: EC2 > Load Balancers > crm-alb > Listeners**

Click the HTTP:80 listener and edit rules to route:

1. **Path-based routing:**
   - Path `/api/*` → Target group `crm-server-tg`
   - Path `/` (or default) → Target group `crm-web-tg`

2. Or **Host-based routing** (if using separate domains):
   - Host `api.example.com` → Target group `crm-server-tg`
   - Host `app.example.com` → Target group `crm-web-tg`

### 13. Update Environment Variables with Final URLs

Now that ALB and services are running, update the task definitions with final URLs:

**Get ALB DNS name:**
1. Go to EC2 > Load Balancers > crm-alb
2. Copy the **DNS name** (e.g., `crm-alb-123456789.us-east-1.elb.amazonaws.com`)

**Update web task definition:**
1. ECS > Task Definitions > `crm-web` > Create new revision
2. In the container definition, update environment:
   - `NEXT_PUBLIC_API_URL` → `https://crm-alb-123456789.us-east-1.elb.amazonaws.com/api` (or your custom domain)
3. Create new revision
4. Update service: ECS > Cluster > Services > `crm-web` > Update
   - Task Definition: Select new revision
   - Force new deployment: Yes
   - Update service

**Update server task definition:**
1. ECS > Task Definitions > `crm-server` > Create new revision
2. In the container definition, update environment:
   - `CLIENT_URL` → `https://crm-alb-123456789.us-east-1.elb.amazonaws.com` (web's URL)
3. Create new revision
4. Update service: ECS > Cluster > Services > `crm-server` > Update
   - Task Definition: Select new revision
   - Force new deployment: Yes
   - Update service

### 14. Verify Deployment

**Test the health endpoint:**

```bash
curl https://crm-alb-123456789.us-east-1.elb.amazonaws.com/api/health

# Expected response (200 OK):
{
  "status": "ok",
  "timestamp": "2026-07-21T15:30:45.123Z",
  "uptimeSeconds": 1234.567,
  "version": "1.0.0",
  "database": "ok",
  "redis": "ok",
  "responseTimeMs": 45
}
```

If `database` or `redis` show `"error"`, check:
1. Security groups allow ECS tasks to reach RDS (5432) and ElastiCache (6379)
2. Secrets are correctly stored in Secrets Manager
3. ECS task logs (CloudWatch > Log Groups > /ecs/crm-server) for detailed errors

**Test the web frontend:**

Open your browser to `https://crm-alb-123456789.us-east-1.elb.amazonaws.com`

(If using HTTP without TLS, use `http://...` but consider adding HTTPS/SSL via ACM after initial testing.)
