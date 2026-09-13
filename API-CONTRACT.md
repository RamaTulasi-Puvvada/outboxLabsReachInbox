# API contract

Base URL: `http://localhost:5000`

- `GET /health` → `{ status, time }`
- `POST /api/auth/google` body `{ idToken }` → `{ user }`
- `POST /api/auth/demo` body `{ email, name }` → `{ user }` (development fallback)
- `GET /api/emails/scheduled?userId=<id>&q=<optional>` → `EmailJob[]`
- `GET /api/emails/sent?userId=<id>&q=<optional>` → `EmailJob[]`
- `GET /api/emails/search?userId=<id>&q=<optional>&status=<optional>` → `EmailJob[]`
- `GET /api/emails/:id?userId=<id>` → `EmailJob`
- `POST /api/emails/schedule` body `{ userId, recipients, subject, body, startTime, delayBetweenEmailsMs, hourlyLimit }`
- `POST /api/slack/connect-webhook` body `{ userId, webhookUrl }`

The frontend uses `/api/emails/sent?q=...` for Elasticsearch-backed search and `/api/emails/scheduled` for queue state. Search falls back to PostgreSQL if Elasticsearch is unavailable.
