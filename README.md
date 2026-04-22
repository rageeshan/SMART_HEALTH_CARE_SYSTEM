# Smart Health Care System

AI-Enabled Smart Healthcare Appointment & Telemedicine Platform built with a **microservices architecture**, containerised with **Docker** and orchestrated using **Kubernetes**.

## Architecture

```
┌───────────────────────────────────────────────────────┐
│              Kubernetes Cluster / Docker Compose       │
│                                                       │
│   ┌─────────┐  Ingress / nginx reverse-proxy          │
│   │ Frontend │──────────────────────────────┐         │
│   │ (React)  │                              │         │
│   └─────────┘                               ▼         │
│       │          ┌──────────────────────────────┐     │
│       │          │        API Services           │     │
│       ├─────────►│  auth-service         :5001   │     │
│       ├─────────►│  patient-service      :5002   │     │
│       ├─────────►│  appointment-service  :5003   │     │
│       ├─────────►│  doctor-service       :5004   │     │
│       ├─────────►│  notification-service :5005   │     │
│       ├─────────►│  telemedicine-service :5006   │     │
│       ├─────────►│  ai-symptom-service   :5007   │     │
│       └─────────►│  payment-service      :5008   │     │
│                  └────────────┬───────────────────┘     │
│                               │                        │
│              ┌────────────────┼────────────────┐       │
│              ▼                ▼                ▼       │
│         ┌─────────┐   ┌───────────┐   ┌──────────┐   │
│         │ MongoDB  │   │ RabbitMQ  │   │  Stripe  │   │
│         │ (Atlas)  │   │  (AMQP)   │   │  OpenAI  │   │
│         └─────────┘   └───────────┘   └──────────┘   │
└───────────────────────────────────────────────────────┘
```

## Technology Stack

| Layer          | Technology                                |
| -------------- | ----------------------------------------- |
| Frontend       | React 19, Vite, Tailwind CSS              |
| Backend        | Node.js, Express                          |
| Database       | MongoDB (Atlas)                           |
| Message Broker | RabbitMQ                                  |
| Payments       | Stripe                                    |
| AI             | OpenAI API                                |
| Auth           | JWT, bcrypt                               |
| Containers     | Docker (multi-stage builds)               |
| Orchestration  | Kubernetes (Deployments, Services, HPA, Ingress) |

---

## Prerequisites

- **Node.js** >= 18
- **Docker** & **Docker Compose** v2
- **kubectl** (for Kubernetes deployment)
- A Kubernetes cluster (Docker Desktop / Minikube / cloud)
- **MongoDB Atlas** account (or local MongoDB)
- **Stripe** test keys
- **OpenAI** API key (for AI symptom checker)

---

## Option 1 – Docker Compose (Local Development)

### 1. Create `.env` files

```bash
# For each service, copy the example and fill in real values:
for svc in auth-service patient-service appointment-service doctor-service \
           notification-service telemedicine-service ai-symptom-service payment-service; do
  cp services/$svc/.env.example services/$svc/.env
done
```

Edit each `.env` file with your MongoDB URI, API keys, etc.

### 2. Build and run

```bash
docker compose up --build
```

### 3. Access the application

| Component       | URL                       |
| --------------- | ------------------------- |
| Frontend        | http://localhost           |
| RabbitMQ UI     | http://localhost:15672     |

All API requests from the frontend are reverse-proxied through nginx to the correct backend services.

### 4. Stop

```bash
docker compose down
```

---

## Option 2 – Kubernetes Deployment

### 1. Push Docker images

Build and push each service image to Docker Hub (or your registry):

```bash
# Replace 'your-dockerhub-username' with your actual username
export DOCKER_USER=your-dockerhub-username

# Build & push all services
for svc in auth-service patient-service appointment-service doctor-service \
           notification-service telemedicine-service ai-symptom-service payment-service; do
  docker build -t $DOCKER_USER/$svc:latest ./services/$svc
  docker push $DOCKER_USER/$svc:latest
done

# Build & push frontend
docker build -t $DOCKER_USER/frontend:latest ./frontend
docker push $DOCKER_USER/frontend:latest
```

### 2. Update image names in K8s manifests

In each file under `k8s/`, replace `your-dockerhub-username` with your actual Docker Hub username.

### 3. Install prerequisites in the cluster

```bash
# ingress-nginx controller
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.10.1/deploy/static/provider/cloud/deploy.yaml

# metrics-server (required for HPA)
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
```

### 4. Create secrets

```bash
cp k8s/secrets.example.yaml k8s/secrets.yaml
# Edit k8s/secrets.yaml with real credentials
```

### 5. Deploy

```bash
chmod +x deploy-k8s.sh
./deploy-k8s.sh
```

### 6. Verify

```bash
kubectl get pods    -n healthcare
kubectl get svc     -n healthcare
kubectl get ingress -n healthcare
kubectl get hpa     -n healthcare
```

### 7. Tear down

```bash
kubectl delete namespace healthcare
```

---

## Project Structure

```
SMART_HEALTH_CARE_SYSTEM/
├── frontend/                   # React SPA (Vite + Tailwind)
│   ├── Dockerfile
│   ├── nginx.conf              # Reverse-proxy config
│   └── src/
├── services/
│   ├── auth-service/           # JWT authentication & registration
│   ├── patient-service/        # Patient profiles & medical records
│   ├── appointment-service/    # Appointment booking & management
│   ├── doctor-service/         # Doctor profiles & availability
│   ├── notification-service/   # Email/SMS via RabbitMQ consumers
│   ├── telemedicine-service/   # Video session management
│   ├── ai-symptom-service/     # OpenAI-powered symptom checker
│   └── payment-service/        # Stripe payment processing
├── k8s/                        # Kubernetes manifests
│   ├── namespace.yaml
│   ├── secrets.example.yaml
│   ├── rabbitmq.yaml
│   ├── *-service.yaml          # Deployment + Service per microservice
│   ├── frontend.yaml
│   ├── hpa.yaml                # HorizontalPodAutoscaler
│   └── ingress.yaml            # ingress-nginx routing
├── docker-compose.yml          # Local multi-container orchestration
├── deploy-k8s.sh               # One-command K8s deployment script
└── README.md
```

---

## Service Ports

| Service              | Port |
| -------------------- | ---- |
| Auth Service         | 5001 |
| Patient Service      | 5002 |
| Appointment Service  | 5003 |
| Doctor Service       | 5004 |
| Notification Service | 5005 |
| Telemedicine Service | 5006 |
| AI Symptom Service   | 5007 |
| Payment Service      | 5008 |
| Frontend (nginx)     | 80   |
| RabbitMQ AMQP        | 5672 |
| RabbitMQ Management  | 15672|
