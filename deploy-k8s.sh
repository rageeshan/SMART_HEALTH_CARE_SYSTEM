#!/usr/bin/env bash
# ===========================================================
#  deploy-k8s.sh
#
#  Applies all Kubernetes manifests to the current cluster
#  in the correct dependency order.
#
#  Prerequisites:
#    1. A running Kubernetes cluster (Docker Desktop / Minikube / cloud)
#    2. kubectl configured to point at that cluster
#    3. ingress-nginx controller installed:
#         kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.10.1/deploy/static/provider/cloud/deploy.yaml
#    4. metrics-server installed (for HPA):
#         kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
#    5. k8s/secrets.yaml created from k8s/secrets.example.yaml
#
#  Usage:
#    chmod +x deploy-k8s.sh
#    ./deploy-k8s.sh
#
#  To tear down everything:
#    kubectl delete namespace healthcare
# ===========================================================
set -euo pipefail

echo "=== Deploying Smart Health Care System to Kubernetes ==="
echo ""

# 0. Pre-flight check
if [ ! -f k8s/secrets.yaml ]; then
  echo "ERROR: k8s/secrets.yaml not found."
  echo "Copy k8s/secrets.example.yaml -> k8s/secrets.yaml and fill in real values."
  exit 1
fi

# 1. Namespace
echo "[1/7] Creating namespace..."
kubectl apply -f k8s/namespace.yaml

# 2. Secrets
echo "[2/7] Applying secrets..."
kubectl apply -f k8s/secrets.yaml

# 3. RabbitMQ (notification + telemedicine depend on it)
echo "[3/7] Deploying RabbitMQ..."
kubectl apply -f k8s/rabbitmq.yaml
echo "       Waiting for RabbitMQ to be ready..."
kubectl rollout status deployment/rabbitmq -n healthcare --timeout=120s

# 4. Core backend services
echo "[4/7] Deploying backend services..."
kubectl apply -f k8s/auth-service.yaml
kubectl apply -f k8s/patient-service.yaml
kubectl apply -f k8s/doctor-service.yaml
kubectl apply -f k8s/appointment-service.yaml
kubectl apply -f k8s/notification-service.yaml
kubectl apply -f k8s/telemedicine-service.yaml
kubectl apply -f k8s/ai-symptom-service.yaml
kubectl apply -f k8s/payment-service.yaml

# 5. Frontend
echo "[5/7] Deploying frontend..."
kubectl apply -f k8s/frontend.yaml

# 6. Horizontal Pod Autoscalers
echo "[6/7] Applying HPA rules..."
kubectl apply -f k8s/hpa.yaml

# 7. Ingress
echo "[7/7] Applying Ingress..."
kubectl apply -f k8s/ingress.yaml

echo ""
echo "=== Deployment complete! ==="
echo ""
echo "Check status:"
echo "  kubectl get pods    -n healthcare"
echo "  kubectl get svc     -n healthcare"
echo "  kubectl get ingress -n healthcare"
echo "  kubectl get hpa     -n healthcare"
