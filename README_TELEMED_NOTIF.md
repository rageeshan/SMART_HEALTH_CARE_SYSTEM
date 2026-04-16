# Telemedicine + Notification Services

This workspace contains your part of the assignment:

- `services/telemedicine-service`
- `services/notification-service`
- `frontend`

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

1. Copy `.env.example` to `.env` in each backend service.
2. Install dependencies:
   - `services/telemedicine-service`
   - `services/notification-service`
   - `frontend`
3. Start the backend services with `npm start`.
4. Start the frontend with `npm run dev`.
5. Ensure RabbitMQ is running on `amqp://localhost` if you want event-driven testing.

### Optional Local-Dev Mode

If RabbitMQ is not available yet, keep `REQUIRE_RABBITMQ=false` in `.env`.
Services will still run REST APIs, but queue consumers stay inactive.

