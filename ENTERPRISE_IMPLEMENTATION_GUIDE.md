# 🏗️ Betcha Enterprise Implementation Guide
**Building a Production-Grade, Regulated Betting Platform**

---

## 📋 Overview

This guide walks you through implementing the enterprise architecture for Betcha - a scalable, secure, and compliant betting platform designed for millions of users.

### What You're Building

- **Microservices Architecture:** 5+ independent Python FastAPI services
- **Infrastructure:** Docker + Kubernetes with auto-scaling
- **Database:** PostgreSQL with replication and sharding
- **Security:** Bank-grade encryption, compliance features
- **Monitoring:** Full observability stack (Prometheus, Grafana, ELK)
- **Scale:** Designed for 1M+ concurrent users

---

## 🎯 Implementation Phases

### Phase 1: Local Development (Week 1-2)
Build and test everything locally using Docker Compose

### Phase 2: Infrastructure Setup (Week 3-4)
Setup Kubernetes cluster and core infrastructure

### Phase 3: Service Implementation (Week 5-8)
Build all microservices with full features

### Phase 4: Compliance & Security (Week 9-12)
Implement financial regulations and security hardening

### Phase 5: Testing & Launch (Week 13-16)
Load testing, security audit, production deployment

---

## 🚀 Phase 1: Local Development Setup

### Prerequisites

Install these tools:
```bash
# Docker Desktop (includes Docker Compose)
# Download from: https://www.docker.com/products/docker-desktop

# kubectl (Kubernetes CLI)
brew install kubectl  # macOS
# OR: https://kubernetes.io/docs/tasks/tools/

# helm (Kubernetes package manager)
brew install helm  # macOS

# Python 3.12+
brew install python@3.12

# Poetry (Python dependency management)
curl -sSL https://install.python-poetry.org | python3 -
```

### Step 1: Generate Secrets

```bash
cd "/Users/mac/Documents/Betcha App/infrastructure/docker"

# Generate secure passwords
export DB_PASSWORD=$(openssl rand -hex 32)
export REDIS_PASSWORD=$(openssl rand -hex 32)
export RABBITMQ_PASSWORD=$(openssl rand -hex 32)
export JWT_SECRET_KEY=$(openssl rand -hex 64)

# Generate JWT RSA keys
mkdir -p secrets
openssl genrsa -out secrets/jwt_private_key.pem 2048
openssl rsa -in secrets/jwt_private_key.pem -pubout -out secrets/jwt_public_key.pem

# Create .env file
cat > .env << EOF
DB_PASSWORD=${DB_PASSWORD}
REDIS_PASSWORD=${REDIS_PASSWORD}
RABBITMQ_PASSWORD=${RABBITMQ_PASSWORD}
JWT_SECRET_KEY=${JWT_SECRET_KEY}
KONG_PG_PASSWORD=$(openssl rand -hex 32)
MINIO_ACCESS_KEY=betcha_minio
MINIO_SECRET_KEY=$(openssl rand -hex 32)
GRAFANA_PASSWORD=admin_change_me
YOCO_SECRET_KEY=sk_test_your_key_here
PAYSTACK_SECRET_KEY=sk_test_your_key_here
JUMIO_API_TOKEN=your_jumio_token
JUMIO_API_SECRET=your_jumio_secret
EOF

echo "✅ Secrets generated and saved to .env"
```

### Step 2: Start Infrastructure

```bash
cd "/Users/mac/Documents/Betcha App/infrastructure/docker"

# Start all infrastructure services
docker-compose up -d postgres-primary redis-master rabbitmq minio

# Wait for services to be healthy
echo "Waiting for services to start..."
sleep 30

# Verify services are running
docker-compose ps

# Check logs if any issues
docker-compose logs postgres-primary
docker-compose logs redis-master
```

### Step 3: Initialize Databases

```bash
# Create databases for each service
docker-compose exec postgres-primary psql -U betcha -c "CREATE DATABASE betcha_auth;"
docker-compose exec postgres-primary psql -U betcha -c "CREATE DATABASE betcha_betting;"
docker-compose exec postgres-primary psql -U betcha -c "CREATE DATABASE betcha_wallet;"
docker-compose exec postgres-primary psql -U betcha -c "CREATE DATABASE betcha_payment;"
docker-compose exec postgres-primary psql -U betcha -c "CREATE DATABASE betcha_kyc;"

echo "✅ Databases created"
```

### Step 4: Build Auth Service

```bash
cd "/Users/mac/Documents/Betcha App/backend/services/auth"

# Create project structure
mkdir -p app/{api/v1,core,models,schemas,services,middleware,utils}
touch app/__init__.py
touch app/api/__init__.py
touch app/api/v1/__init__.py

# Install dependencies
pip install -r requirements.txt

# Run database migrations
alembic init alembic
alembic revision --autogenerate -m "Initial migration"
alembic upgrade head

echo "✅ Auth service ready"
```

### Step 5: Start Auth Service

```bash
# Option 1: Run directly
uvicorn main:app --reload --host 0.0.0.0 --port 8100

# Option 2: Run with Docker
cd "/Users/mac/Documents/Betcha App"
docker-compose up -d auth-service

# Test the service
curl http://localhost:8100/health
# Should return: {"status":"healthy","service":"auth"}

# View API docs
open http://localhost:8100/api/docs
```

### Step 6: Repeat for Other Services

Follow the same pattern for:
- `betting-service` (port 8101)
- `wallet-service` (port 8102)
- `payment-service` (port 8103)
- `kyc-service` (port 8104)

---

## 🏗️ Phase 2: Kubernetes Setup

### Step 1: Choose Kubernetes Platform

**Option A: Local Development (Recommended for testing)**
```bash
# Install minikube
brew install minikube

# Start local cluster
minikube start --cpus=4 --memory=8192 --disk-size=50g
minikube addons enable ingress
minikube addons enable metrics-server
```

**Option B: Cloud Providers (Production)**

**AWS EKS:**
```bash
# Install eksctl
brew install eksctl

# Create cluster
eksctl create cluster \
  --name betcha-production \
  --region af-south-1 \
  --nodegroup-name standard-workers \
  --node-type t3.xlarge \
  --nodes 3 \
  --nodes-min 3 \
  --nodes-max 10 \
  --managed
```

**Google GKE:**
```bash
# Install gcloud
brew install google-cloud-sdk

# Create cluster
gcloud container clusters create betcha-production \
  --zone africa-south1-a \
  --machine-type n1-standard-4 \
  --num-nodes 3 \
  --enable-autoscaling \
  --min-nodes 3 \
  --max-nodes 10
```

**DigitalOcean (Cost-effective):**
```bash
# Install doctl
brew install doctl

# Create cluster
doctl kubernetes cluster create betcha-production \
  --region fra1 \
  --size s-4vcpu-8gb \
  --count 3 \
  --auto-upgrade \
  --surge-upgrade \
  --ha
```

### Step 2: Install Core Components

```bash
cd "/Users/mac/Documents/Betcha App/infrastructure/kubernetes"

# Create namespaces
kubectl apply -f namespace.yaml

# Install cert-manager (SSL certificates)
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml

# Install NGINX Ingress Controller
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm install ingress-nginx ingress-nginx/ingress-nginx \
  --namespace ingress-nginx \
  --create-namespace \
  --set controller.metrics.enabled=true

# Install Sealed Secrets (for secret management)
helm repo add sealed-secrets https://bitnami-labs.github.io/sealed-secrets
helm install sealed-secrets sealed-secrets/sealed-secrets \
  --namespace kube-system
```

### Step 3: Deploy PostgreSQL

```bash
# Install Patroni Operator for HA PostgreSQL
helm repo add postgres-operator-charts https://opensource.zalando.com/postgres-operator/charts/postgres-operator
helm install postgres-operator postgres-operator-charts/postgres-operator \
  --namespace betcha-production

# Deploy PostgreSQL cluster
kubectl apply -f postgres-statefulset.yaml

# Wait for PostgreSQL to be ready
kubectl wait --for=condition=ready pod -l app=postgres -n betcha-production --timeout=300s

# Create databases
kubectl exec -it postgres-0 -n betcha-production -- psql -U betcha -c "CREATE DATABASE betcha_auth;"
# Repeat for other databases
```

### Step 4: Deploy Redis

```bash
# Install Redis Operator
helm repo add ot-helm https://ot-container-kit.github.io/helm-charts/
helm install redis-operator ot-helm/redis-operator \
  --namespace betcha-production

# Deploy Redis cluster
kubectl apply -f redis-cluster.yaml

# Verify Redis is running
kubectl get pods -n betcha-production | grep redis
```

### Step 5: Deploy RabbitMQ

```bash
# Install RabbitMQ Cluster Operator
kubectl apply -f https://github.com/rabbitmq/cluster-operator/releases/latest/download/cluster-operator.yml

# Deploy RabbitMQ cluster
kubectl apply -f rabbitmq-cluster.yaml

# Wait for RabbitMQ to be ready
kubectl wait --for=condition=ready pod -l app=rabbitmq -n betcha-production --timeout=300s
```

---

## 🔐 Phase 3: Security & Secrets

### Step 1: Create Kubernetes Secrets

```bash
# Database credentials
kubectl create secret generic database-credentials \
  --from-literal=auth-database-url="postgresql+asyncpg://betcha:${DB_PASSWORD}@postgres-primary:5432/betcha_auth" \
  --from-literal=betting-database-url="postgresql+asyncpg://betcha:${DB_PASSWORD}@postgres-primary:5432/betcha_betting" \
  --from-literal=wallet-database-url="postgresql+asyncpg://betcha:${DB_PASSWORD}@postgres-primary:5432/betcha_wallet" \
  --from-literal=payment-database-url="postgresql+asyncpg://betcha:${DB_PASSWORD}@postgres-primary:5432/betcha_payment" \
  --from-literal=kyc-database-url="postgresql+asyncpg://betcha:${DB_PASSWORD}@postgres-primary:5432/betcha_kyc" \
  --namespace betcha-production

# Redis credentials
kubectl create secret generic redis-credentials \
  --from-literal=redis-url="redis://:${REDIS_PASSWORD}@redis-master:6379/0" \
  --namespace betcha-production

# JWT secrets
kubectl create secret generic jwt-secrets \
  --from-file=private-key=secrets/jwt_private_key.pem \
  --from-file=public-key=secrets/jwt_public_key.pem \
  --from-literal=secret-key=${JWT_SECRET_KEY} \
  --namespace betcha-production

# Payment provider secrets
kubectl create secret generic payment-secrets \
  --from-literal=yoco-secret-key=${YOCO_SECRET_KEY} \
  --from-literal=paystack-secret-key=${PAYSTACK_SECRET_KEY} \
  --namespace betcha-production
```

### Step 2: Deploy Services

```bash
# Build and push Docker images
# (Replace with your Docker registry)
export DOCKER_REGISTRY="your-registry.io"

cd "/Users/mac/Documents/Betcha App/backend/services/auth"
docker build -t ${DOCKER_REGISTRY}/betcha-auth-service:v1.0.0 .
docker push ${DOCKER_REGISTRY}/betcha-auth-service:v1.0.0

# Deploy auth service
kubectl apply -f ../../infrastructure/kubernetes/auth-service-deployment.yaml

# Verify deployment
kubectl get pods -n betcha-production -l app=auth-service
kubectl logs -f -n betcha-production -l app=auth-service

# Repeat for other services
```

---

## 📊 Phase 4: Monitoring Stack

### Step 1: Install Prometheus

```bash
# Add Prometheus Helm repo
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

# Install Prometheus
helm install prometheus prometheus-community/kube-prometheus-stack \
  --namespace betcha-monitoring \
  --create-namespace \
  --set prometheus.prometheusSpec.retention=30d \
  --set prometheus.prometheusSpec.storageSpec.volumeClaimTemplate.spec.resources.requests.storage=100Gi
```

### Step 2: Install Grafana

```bash
# Grafana is included in kube-prometheus-stack
# Get admin password
kubectl get secret -n betcha-monitoring prometheus-grafana -o jsonpath="{.data.admin-password}" | base64 --decode

# Port forward to access
kubectl port-forward -n betcha-monitoring svc/prometheus-grafana 3000:80

# Open http://localhost:3000
# Username: admin, Password: (from above)
```

### Step 3: Install ELK Stack

```bash
# Add Elastic Helm repo
helm repo add elastic https://helm.elastic.co
helm repo update

# Install Elasticsearch
helm install elasticsearch elastic/elasticsearch \
  --namespace betcha-monitoring \
  --set replicas=3 \
  --set resources.requests.memory=2Gi

# Install Kibana
helm install kibana elastic/kibana \
  --namespace betcha-monitoring

# Install Filebeat (log shipper)
helm install filebeat elastic/filebeat \
  --namespace betcha-monitoring
```

---

## 🧪 Phase 5: Testing

### Load Testing with K6

```bash
# Install k6
brew install k6

# Create load test script
cat > load-test.js << 'EOF'
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '2m', target: 100 },   // Ramp up to 100 users
    { duration: '5m', target: 100 },   // Stay at 100 users
    { duration: '2m', target: 1000 },  // Ramp up to 1000 users
    { duration: '5m', target: 1000 },  // Stay at 1000 users
    { duration: '2m', target: 0 },     // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],  // 95% of requests < 500ms
    http_req_failed: ['rate<0.01'],    // Error rate < 1%
  },
};

export default function () {
  let res = http.get('http://your-domain.com/api/v1/health');
  check(res, {
    'status is 200': (r) => r.status === 200,
  });
  sleep(1);
}
EOF

# Run load test
k6 run load-test.js
```

### Security Testing

```bash
# Install OWASP ZAP
brew install --cask owasp-zap

# Run automated security scan
docker run -t owasp/zap2docker-stable zap-baseline.py \
  -t http://your-domain.com \
  -r security-report.html
```

---

## 🚀 Phase 6: Production Deployment

### Step 1: DNS Configuration

```bash
# Point your domain to load balancer
# Get load balancer IP
kubectl get svc ingress-nginx-controller -n ingress-nginx

# Add DNS A record:
# betcha.com -> <LOAD_BALANCER_IP>
# api.betcha.com -> <LOAD_BALANCER_IP>
```

### Step 2: SSL Certificates

```bash
# Create ClusterIssuer for Let's Encrypt
kubectl apply -f - <<EOF
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: admin@betcha.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
EOF

# Certificates will be automatically provisioned via Ingress annotations
```

### Step 3: Deploy to Production

```bash
# Switch to production namespace
kubectl config set-context --current --namespace=betcha-production

# Deploy all services
kubectl apply -f infrastructure/kubernetes/

# Watch rollout
kubectl rollout status deployment/auth-service
kubectl rollout status deployment/betting-service
kubectl rollout status deployment/wallet-service
kubectl rollout status deployment/payment-service
kubectl rollout status deployment/kyc-service

# Verify all pods are running
kubectl get pods
```

### Step 4: Database Migrations

```bash
# Run migrations for each service
kubectl exec -it deployment/auth-service -- alembic upgrade head
kubectl exec -it deployment/betting-service -- alembic upgrade head
kubectl exec -it deployment/wallet-service -- alembic upgrade head
kubectl exec -it deployment/payment-service -- alembic upgrade head
kubectl exec -it deployment/kyc-service -- alembic upgrade head
```

---

## 📈 Monitoring & Maintenance

### Daily Checks

```bash
# Check pod health
kubectl get pods -n betcha-production

# Check resource usage
kubectl top nodes
kubectl top pods -n betcha-production

# Check logs for errors
kubectl logs -n betcha-production -l app=auth-service --tail=100 | grep ERROR
```

### Weekly Tasks

1. Review Grafana dashboards
2. Check error rates in Kibana
3. Review security alerts
4. Check database backups
5. Review cost reports

### Monthly Tasks

1. Update dependencies
2. Security patches
3. Performance optimization
4. Capacity planning
5. Disaster recovery drill

---

## 💰 Cost Estimation

### AWS (100K active users)
- **EKS Cluster:** $150/month
- **EC2 Instances (6x t3.xlarge):** $900/month
- **RDS PostgreSQL:** $800/month
- **ElastiCache Redis:** $200/month
- **S3 Storage:** $50/month
- **CloudFront:** $100/month
- **Load Balancer:** $25/month
- **Total:** ~$2,225/month

### Google Cloud (100K active users)
- **GKE Cluster:** $100/month
- **Compute Instances:** $850/month
- **Cloud SQL:** $750/month
- **Memorystore Redis:** $180/month
- **Cloud Storage:** $40/month
- **Load Balancer:** $20/month
- **Total:** ~$1,940/month

### DigitalOcean (Most Cost-Effective)
- **Kubernetes:** $120/month (3x nodes)
- **Managed PostgreSQL:** $360/month
- **Managed Redis:** $120/month
- **Spaces (S3):** $5/month
- **Load Balancer:** $12/month
- **Total:** ~$617/month

---

## 🎓 Learning Resources

### Documentation
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [SQLAlchemy 2.0](https://docs.sqlalchemy.org/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

### Books
- "Designing Data-Intensive Applications" - Martin Kleppmann
- "Site Reliability Engineering" - Google
- "Building Microservices" - Sam Newman

### Courses
- [FastAPI - The Complete Course](https://www.udemy.com/course/fastapi-the-complete-course/)
- [Kubernetes for Developers](https://www.udemy.com/course/kubernetes-for-developers/)

---

## ✅ Success Checklist

Before going live:
- [ ] All services deployed and healthy
- [ ] Load testing passed (1000+ concurrent users)
- [ ] Security audit completed
- [ ] Monitoring dashboards configured
- [ ] Alerts configured (PagerDuty/OpsGenie)
- [ ] Backup and disaster recovery tested
- [ ] Documentation complete
- [ ] Team trained on operations
- [ ] Compliance review completed
- [ ] Legal terms reviewed
- [ ] Payment processing tested
- [ ] Customer support ready

---

## 🆘 Troubleshooting

### Common Issues

**Pods CrashLoopBackOff:**
```bash
kubectl describe pod <pod-name> -n betcha-production
kubectl logs <pod-name> -n betcha-production --previous
```

**Database Connection Issues:**
```bash
kubectl exec -it deployment/auth-service -- env | grep DATABASE
kubectl exec -it postgres-0 -- psql -U betcha -c "SELECT 1"
```

**High Memory Usage:**
```bash
kubectl top pods -n betcha-production
kubectl describe node <node-name>
```

---

**This implementation guide provides a complete path from local development to production deployment of an enterprise-grade betting platform.**

**Next Steps:**
1. Start with Phase 1 (local development)
2. Build one service completely before moving to others
3. Test thoroughly at each phase
4. Deploy to staging before production
5. Monitor everything

**Questions? See the architecture document ([ENTERPRISE_ARCHITECTURE.md](./ENTERPRISE_ARCHITECTURE.md)) for detailed technical specifications.**
