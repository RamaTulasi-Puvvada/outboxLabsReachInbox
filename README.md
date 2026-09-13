# ReachInbox Email Scheduler — React + Vite

A full-stack email job scheduler built for the ReachInbox hiring assignment. The frontend is **React + TypeScript + Vite + Tailwind CSS v3 + React Router**. The backend is **Node.js + Express + TypeScript + Prisma/PostgreSQL + BullMQ/Redis + Elasticsearch + Ethereal SMTP**.

## What is implemented

- Google OAuth login with a development credentials fallback when Google credentials are not configured.
- React Router pages for login, scheduled mail, sent mail, compose, and email detail.
- Figma-inspired light UI with emerald accents, sidebar navigation, header profile, pills, search and responsive layouts.
- CSV/TXT lead upload with local email extraction and duplicate removal.
- Campaign scheduling with start time, per-email delay and sender hourly limit.
- BullMQ delayed jobs; **no cron jobs**.
- PostgreSQL persistence through Prisma.
- Redis-backed atomic hourly rate limiting. Rate-limited jobs are rescheduled into the next UTC hour rather than dropped.
- Configurable worker concurrency and minimum provider delay.
- Elasticsearch indexing and text search.
- Live Bull Board at `http://localhost:5000/admin/queues`.
- Ethereal fake SMTP delivery for safe testing.
- Slack Incoming Webhook alerts when a sender reaches its hourly limit.
- Server restart persistence through Redis + PostgreSQL.

## Prerequisites on Windows

1. Node.js LTS
2. Docker Desktop with virtualization/WSL2 working
3. VS Code

Verify:

```powershell
node --version
npm --version
docker --version
docker compose version
```

## 1. Start infrastructure

From the project root:

```powershell
docker compose up -d
docker compose ps
```

The services are PostgreSQL `5432`, Redis `6379`, and Elasticsearch `9200`.

## 2. Configure backend

```powershell
cd backend
copy .env.example .env
npm install
npx prisma generate
npx prisma migrate dev --name init
```

For real Google login, put your Google Web Client ID in `backend/.env` as `GOOGLE_CLIENT_ID`.

## 3. Start backend

```powershell
npm run dev
```

Check `http://localhost:5000/health`. Expected JSON:

```json
{"status":"ok","time":"..."}
```

Bull Board: `http://localhost:5000/admin/queues`

## 4. Configure frontend

Open a second terminal:

```powershell
cd frontend
copy .env.local.example .env.local
npm install
npm run dev
```

Open `http://localhost:3000`.

If `VITE_GOOGLE_CLIENT_ID` is blank, use the clearly labelled development credentials fallback. For the assignment demo, configure real Google OAuth instead.

### Google OAuth

Create a Google OAuth 2.0 Web Client ID and add this Authorized JavaScript origin:

`http://localhost:3000`

Set the same client ID in both:

- `frontend/.env.local` → `VITE_GOOGLE_CLIENT_ID`
- `backend/.env` → `GOOGLE_CLIENT_ID`

Restart the Vite and backend terminals after changing env files.

## 5. Demo flow

1. Sign in.
2. Click **Compose New Email**.
3. Enter subject and body.
4. Upload `sample-data/leads.csv`.
5. Choose a future start time.
6. Set delay, for example `2000` ms.
7. Set hourly limit, for example `200`.
8. Schedule the campaign.
9. Open Bull Board and inspect delayed jobs.
10. After delivery, open **Sent** and search recipient/subject/body.
11. Click an email to open its detail view.

## Demo Video : https://drive.google.com/file/d/1sxd4ZQRaYNcD14pjB4P9Y-oK1XHhJNit/view?usp=sharing

## Rate-limit demo

1. Connect a Slack Incoming Webhook in the header.
2. Compose a campaign with 3+ recipients.
3. Set hourly limit to `1`.
4. Schedule them close together.
5. The first job can send; later jobs are marked `RATE_LIMITED`, Slack is notified, and the jobs are re-added to BullMQ for the next hour.

## Restart persistence demo

Schedule an email five minutes into the future, stop only the backend with `Ctrl+C`, start it again with `npm run dev`, and inspect Bull Board. The delayed BullMQ job remains persisted in Redis and the PostgreSQL record remains intact.

## Architecture

```text
React/Vite
   │ HTTP
   ▼
Express API ─────── PostgreSQL/Prisma
   │
   ├────────────── Elasticsearch (search/index)
   │
   └────────────── BullMQ ─── Redis (delayed jobs)
                          │
                          ▼
                       Worker
                          │
                          └── Ethereal SMTP
```

Scheduling is done by BullMQ delayed jobs only. There is no cron implementation. The worker reads the durable EmailJob record before sending, applies Redis-backed rate limiting, waits for the configured provider delay, sends through Ethereal, and updates the database/index.

## Final project structure

```text
reachinbox-scheduler/
├── backend/
│   ├── prisma/schema.prisma
│   ├── src/
│   │   ├── config.ts
│   │   ├── config/clients.ts
│   │   ├── index.ts
│   │   ├── queues/emailQueue.ts
│   │   ├── routes/auth.ts
│   │   ├── routes/emails.ts
│   │   ├── routes/slack.ts
│   │   ├── services/elasticsearch.ts
│   │   ├── services/mailer.ts
│   │   ├── services/rateLimiter.ts
│   │   ├── services/slack.ts
│   │   ├── utils/logger.ts
│   │   └── workers/emailWorker.ts
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/ComposeView.tsx
│   │   ├── components/EmailDetailView.tsx
│   │   ├── pages/DashboardLayout.tsx
│   │   ├── pages/Login.tsx
│   │   ├── services/api.ts
│   │   ├── types/index.ts
│   │   ├── App.tsx
│   │   ├── index.css
│   │   ├── main.tsx
│   │   └── vite-env.d.ts
│   ├── .env.local.example
│   ├── index.html
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── vite.config.ts
├── sample-data/leads.csv
├── docker-compose.yml
└── README.md
```
