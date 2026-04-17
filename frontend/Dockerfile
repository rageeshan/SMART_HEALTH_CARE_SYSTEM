# ---- Build Stage ----
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Build the Vite app - API URLs will be baked in from build args
ARG VITE_AUTH_BASE_URL=http://localhost/api/auth
ARG VITE_PATIENT_BASE_URL=http://localhost/api/patients
ARG VITE_SYMPTOM_API_URL=http://localhost/api/symptoms
ARG VITE_PAYMENT_API_URL=http://localhost/api/payments

ENV VITE_AUTH_BASE_URL=$VITE_AUTH_BASE_URL
ENV VITE_PATIENT_BASE_URL=$VITE_PATIENT_BASE_URL
ENV VITE_SYMPTOM_API_URL=$VITE_SYMPTOM_API_URL
ENV VITE_PAYMENT_API_URL=$VITE_PAYMENT_API_URL

RUN npm run build

# ---- Production Stage (Nginx) ----
FROM nginx:stable-alpine

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
