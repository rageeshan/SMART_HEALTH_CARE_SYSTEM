#!/usr/bin/env bash
# ===========================================================
#  deploy-k8s.sh
#
#  Applies all Kubernetes manifests to the current cluster
#  in the correct dependency order.
#
#  Usage:
#    chmod +x deploy-k8s.sh
#    ./deploy-k8s.sh
#
#  To tear down everything:
#    kubectl delete namespace healthcare
# ===========================================================
set -euo pipefail

echo "▶  Deploying Smart Health Care System to Kubernetes"
echo ""

# 1. Namespace (must exist before everything else)
echo "📦  Creating namespace..."
kubectl apply -f k8s/namespace.yaml

# 2. Secrets  ⚠️  Fill in k8s/secrets.yaml before this step!
echo "🔐  Applying secrets..."
kubectl apply -f k8s/secrets.yaml

# 3. RabbitMQ (notification + telemedicine depend on it)
echo "🐇  Deploying RabbitMQ..."
kubectl apply -f k8s/rabbitmq.yaml
echo "    Waiting for RabbitMQ to be ready..."
kubectl rollout status deployment/rabbitmq -n healthcare --timeout=120s

# 4. Core backend services
echo "⚙️   Deploying backend services..."
kubectl apply -f k8s/auth-service.yaml
kubectl apply -f k8s/patient-service.yaml
kubectl apply -f k8s/appointment-service.yaml
kubectl apply -f k8s/doctor-service.yaml
kubectl apply -f k8s/notification-service.yaml
kubectl apply -f k8s/telemedicine-service.yaml
kubectl apply -f k8s/ai-symptom-service.yaml
kubectl apply -f k8s/payment-service.yaml

# 5. Frontend
echo "🌐  Deploying frontend..."
kubectl apply -f k8s/frontend.yaml

# 6. Horizontal Pod Autoscalers
echo "📈  Applying HPA rules..."
kubectl apply -f k8s/hpa.yaml

# 7. Ingress
echo "🔀  Applying Ingress..."
kubectl apply -f k8s/ingress.yaml

echo ""
echo "✅  Deployment complete!"
echo ""
echo "Check status:"
echo "  kubectl get pods -n healthcare"
echo "  kubectl get svc  -n healthcare"
echo "  kubectl get ingress -n healthcare"
