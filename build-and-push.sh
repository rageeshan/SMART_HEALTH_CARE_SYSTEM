#!/usr/bin/env bash
# ===========================================================
#  build-and-push.sh
#
#  Builds Docker images for every microservice and pushes
#  them to Docker Hub.
#
#  Usage:
#    chmod +x build-and-push.sh
#    DOCKER_USERNAME=yourname ./build-and-push.sh
#    DOCKER_USERNAME=yourname IMAGE_TAG=v1.2.0 ./build-and-push.sh
#
#  Requirements: Docker Desktop running, `docker login` done.
# ===========================================================
set -euo pipefail

DOCKER_USERNAME="${DOCKER_USERNAME:?Must set DOCKER_USERNAME}"
IMAGE_TAG="${IMAGE_TAG:-latest}"

SERVICES=(
  auth-service
  patient-service
  appointment-service
  doctor-service
  notification-service
  telemedicine-service
  ai-symptom-service
  payment-service
)

echo "▶  Building and pushing all images as ${DOCKER_USERNAME}/<service>:${IMAGE_TAG}"
echo ""

# ── Backend services ────────────────────────────────────────
for SERVICE in "${SERVICES[@]}"; do
  IMAGE="${DOCKER_USERNAME}/${SERVICE}:${IMAGE_TAG}"
  CONTEXT="./services/${SERVICE}"

  echo "🔨  Building  ${IMAGE}"
  docker build -t "${IMAGE}" "${CONTEXT}"

  echo "🚀  Pushing   ${IMAGE}"
  docker push "${IMAGE}"
  echo ""
done

# ── Frontend ─────────────────────────────────────────────────
FRONTEND_IMAGE="${DOCKER_USERNAME}/frontend:${IMAGE_TAG}"
echo "🔨  Building  ${FRONTEND_IMAGE}"
docker build \
  --build-arg VITE_AUTH_BASE_URL=http://localhost/api/auth \
  --build-arg VITE_PATIENT_BASE_URL=http://localhost/api/patients \
  --build-arg VITE_SYMPTOM_API_URL=http://localhost/api/symptoms \
  --build-arg VITE_PAYMENT_API_URL=http://localhost/api/payments \
  -t "${FRONTEND_IMAGE}" \
  ./frontend

echo "🚀  Pushing   ${FRONTEND_IMAGE}"
docker push "${FRONTEND_IMAGE}"

echo ""
echo "✅  All images built and pushed successfully!"
echo ""
echo "Next: update the image names in k8s/*.yaml, then run:"
echo "  kubectl apply -f k8s/"
