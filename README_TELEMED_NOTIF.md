# Telemedicine + Notification Services

This workspace contains your part of the assignment:

- `telemedicine-service`
- `notification-service`

## Event-Driven Flow

1. `appointment-service` publishes to queue `appointment_confirmed`.
2. `telemedicine-service` consumes it, creates a Jitsi room, stores session log.
3. `telemedicine-service` publishes `telemedicine_session_created`.
4. `notification-service` consumes both events and sends notifications.

## Required Event Payload from Appointment Service

```json
{
  "appointmentId": "APT_1001",
  "doctorId": "DOC_1",
  "patientId": "PAT_1",
  "doctorEmail": "doctor@example.com",
  "patientEmail": "patient@example.com",
  "patientPhone": "+94712345678"
}
```

## Telemedicine API

- `POST /api/sessions/create`
- `PATCH /api/sessions/:appointmentId/join`
- `PATCH /api/sessions/:appointmentId/end`
- `GET /api/sessions/:appointmentId`

## Notification API

- `POST /api/notifications/send-test`
- `GET /api/notifications/logs`

## Run Locally

1. Copy `.env.example` to `.env` in each service.
2. Install dependencies inside each service: `npm install`.
3. Start each service: `npm run dev` or `npm start`.
4. Ensure RabbitMQ is running on `amqp://localhost`.

### Optional Local-Dev Mode

If RabbitMQ is not available yet, keep `REQUIRE_RABBITMQ=false` in `.env`.
Services will still run REST APIs, but queue consumers stay inactive.

