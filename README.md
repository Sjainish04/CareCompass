# CareCompass Backend — API Server

Node.js/Express REST API powering the CareCompass GTA Healthcare Navigator.

---

## Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 20+ |
| Framework | Express 4 |
| Database | Supabase (Postgres + Auth + RLS) |
| AI — Translation | Cohere `command-a-translate-08-2025` |
| AI — EHR / CDISC | Cohere `command-a-03-2025` |
| AI — Clinical reasoning | Anthropic Claude `claude-sonnet-4-20250514` |
| SMS reminders | Twilio |
| Email reminders | SendGrid |
| Scheduling | node-cron |
| Logging | Winston |

---

## Quick Start

```bash
# 1. Clone and install
git clone https://github.com/your-org/carecompass-backend
cd carecompass-backend
npm install

# 2. Configure environment
cp .env.example .env
# Fill in .env with your keys (see below)

# 3. Set up database
# In Supabase Dashboard → SQL Editor, run in order:
#   supabase_schema.sql   (from the outputs folder)
#   src/lib/schema_v2.sql

# 4. Start dev server
npm run dev

# 5. Verify
curl http://localhost:3001/health
```

---

## Environment Variables

```env
# Required
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJ...   # service role key — server only
SUPABASE_ANON_KEY=eyJ...      # anon key — for auth flows
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# AI (get free tier keys at dashboard.cohere.com and console.anthropic.com)
COHERE_API_KEY=co-...
ANTHROPIC_API_KEY=sk-ant-...

# SMS — Twilio (optional — server logs messages when not set)
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_FROM_NUMBER=+1...

# Email — SendGrid (optional)
SENDGRID_API_KEY=SG....
SENDGRID_FROM_EMAIL=reminders@carecompass.ca

# Security
JWT_SECRET=change-me-to-a-long-random-string
REMINDER_CRON=*/30 * * * *
```

> **Note:** Without Twilio/SendGrid keys the server runs in demo mode — SMS/email calls are logged but not sent. This is fine for development.

---

## API Reference

All protected endpoints require:
```
Authorization: Bearer <supabase_access_token>
```

### Authentication

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/signup` | ❌ | Create account |
| POST | `/api/auth/login` | ❌ | Login → returns access_token |
| POST | `/api/auth/refresh` | ❌ | Refresh access token |
| POST | `/api/auth/logout` | ✅ | Invalidate session |
| GET  | `/api/auth/me` | ✅ | Get own profile |
| PATCH | `/api/auth/me` | ✅ | Update profile |

**POST /api/auth/login**
```json
{ "email": "amara@example.com", "password": "securepass" }
```
Response:
```json
{
  "access_token": "eyJ...",
  "refresh_token": "...",
  "expires_in": 3600,
  "user": { "id": "uuid", "email": "...", "role": "patient", "preferred_lang": "ig" }
}
```

---

### Patients

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/patients/me/summary` | Patient | Full care summary |
| GET | `/api/patients/me/record` | Patient | Health record |
| PUT | `/api/patients/me/record` | Patient | Upsert health record |
| GET | `/api/patients` | Provider | List all patients |
| GET | `/api/patients/:id` | Provider | Patient detail |

**GET /api/patients/me/summary** response:
```json
{
  "health_record": { "conditions": ["hypertension"], "medications": ["Lisinopril 10mg"], "allergies": ["Penicillin"] },
  "upcoming_appointments": [...],
  "active_referrals": [...],
  "care_steps": [...],
  "stats": { "upcoming_count": 2, "active_referrals": 1, "steps_complete": 4, "steps_total": 5 }
}
```

---

### Appointments

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/appointments` | ✅ | List (patient: own / provider: their schedule) |
| GET | `/api/appointments/:id` | ✅ | Single appointment |
| POST | `/api/appointments` | Patient | Book appointment |
| PATCH | `/api/appointments/:id` | ✅ | Reschedule / update status |
| DELETE | `/api/appointments/:id` | ✅ | Cancel (triggers slot recovery) |
| GET | `/api/appointments/provider/today` | Provider | Today's schedule with patient details |

**POST /api/appointments**
```json
{
  "provider_id": "uuid",
  "scheduled_at": "2025-01-15T10:30:00Z",
  "type": "specialist",
  "language": "ig",
  "notes": "Cardiology follow-up"
}
```

Query params for GET: `?status=scheduled&from=2025-01-01&to=2025-02-01&limit=20&offset=0`

---

### Referrals

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/referrals` | ✅ | List referrals (with care steps) |
| GET | `/api/referrals/:id` | ✅ | Single referral detail |
| POST | `/api/referrals` | Provider | Create referral (auto-creates care steps) |
| PATCH | `/api/referrals/:id` | ✅ | Update status / add notes |

**POST /api/referrals** (provider only)
```json
{
  "patient_id": "uuid",
  "referred_provider_id": "uuid",
  "specialty": "Cardiology",
  "reason": "Hypertension workup, borderline LDL",
  "priority": "routine"
}
```
Auto-creates specialty-specific care steps (5 steps for Cardiology, etc.)

---

### Providers / Clinic Finder

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/providers` | ❌ | Search clinics (public) |
| GET | `/api/providers/:id` | ❌ | Clinic detail |
| GET | `/api/providers/:id/slots` | ❌ | Available booking slots |
| PATCH | `/api/providers/me` | Provider | Update own clinic info |

**GET /api/providers** query params:
- `specialty=Cardiology`
- `lang=ig` — filters by supported language
- `accepting=true`
- `search=mount sinai`
- `limit=20&offset=0`

**GET /api/providers/:id/slots** query params:
- `from=2025-01-10`
- `to=2025-01-24`

Returns 30-min slots Mon–Fri 9am–5pm minus already-booked ones.

---

### Navigator Chat

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/navigator/messages` | Patient | Message history |
| POST | `/api/navigator/message` | Patient | Send message, get AI reply |
| DELETE | `/api/navigator/messages` | Patient | Clear history |

**POST /api/navigator/message**
```json
{ "text": "Can you help book my orthopaedics appointment?", "language": "ig" }
```
Response:
```json
{
  "message": {
    "id": "uuid",
    "role": "navigator",
    "text": "Of course! I found 3 available slots at Sunnybrook...",
    "created_at": "2025-01-10T14:22:00Z"
  }
}
```

Claude automatically uses the patient's health record, upcoming appointments, and active referrals as context.

---

### AI Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/ai/translate` | ✅ | Translate text (23 languages) |
| POST | `/api/ai/translate-batch` | ✅ | Translate multiple phrases |
| POST | `/api/ai/extract-ehr` | ✅ | Parse EHR text → structured JSON |
| POST | `/api/ai/cdisc-map` | ✅ | Map to CDISC SDTM variables |
| POST | `/api/ai/clinical-insights` | ✅ | Extract insights from transcript |
| POST | `/api/ai/no-show-risk` | ✅ | Predict no-show risk |

Rate limit: 20 requests/minute per IP.

**POST /api/ai/translate**
```json
{
  "text": "Where does it hurt?",
  "source_lang": "English",
  "target_lang": "Igbo",
  "context": "clinical"
}
```

**POST /api/ai/cdisc-map**
```json
{
  "ehr_text": "Patient: Amara Nwosu, 42F...",
  "domains": ["DM","VS","LB","CM","MH","AE"],
  "sdtm_version": "3.4"
}
```
Response includes `mapping[]`, `compliance_review`, `csv[]`.

---

### Reminders

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/reminders` | Patient | Own reminders |
| POST | `/api/reminders` | Patient | Schedule a reminder |
| POST | `/api/reminders/:id/send` | Provider | Send immediately |
| POST | `/api/reminders/send-bulk` | Provider | Send to all high-risk patients today |

---

### Analytics

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/analytics/provider` | Provider | 30-day dashboard metrics |
| GET | `/api/analytics/patient` | Patient | Journey progress stats |

**GET /api/analytics/provider** response:
```json
{
  "appointments": { "total": 120, "completed": 113, "no_shows": 7, "attendance_rate": 94, "no_show_rate": 6 },
  "referrals": { "total": 45, "completed": 40, "completion_rate": 89 },
  "languages": [{ "lang": "ig", "count": 34, "pct": 28 }, ...],
  "daily_attendance": [{ "date": "2025-01-06", "day": "Mon", "total": 8, "attended": 8, "rate": 100 }, ...]
}
```

---

## Database Schema

Two SQL files to run in Supabase:

1. **`supabase_schema.sql`** — Core tables: profiles, patient_records, providers, appointments, referrals, care_steps, reminders, navigator_log, audit_trail. Full RLS policies. Seed data.

2. **`src/lib/schema_v2.sql`** — Additions: navigator_messages, clinic_reviews, waitlist, cdisc_mappings. Additional indexes and triggers.

---

## Cron Jobs

| Schedule | Job |
|---|---|
| Every 30 min | Process due reminders → send SMS/email |
| Daily 7:00 AM | Bulk SMS to all high-risk patients with appointments today |
| Daily 8:00 AM | Flag yesterday's no-shows, trigger smart slot recovery |
| Every hour | Send 3-hour-before reminder to any same-day appointment without a reminder |

---

## Connecting the Frontend

Replace the inline demo data in `carecompass_unified.html` with API calls:

```javascript
// At the top of your script block, set this after login
const API_BASE = 'http://localhost:3001/api';
let ACCESS_TOKEN = ''; // store after /api/auth/login

async function apiGet(path) {
  const r = await fetch(API_BASE + path, {
    headers: { Authorization: 'Bearer ' + ACCESS_TOKEN }
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

async function apiPost(path, body) {
  const r = await fetch(API_BASE + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + ACCESS_TOKEN },
    body: JSON.stringify(body)
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

// Example: load patient summary on dashboard
async function loadPatientOverview() {
  const data = await apiGet('/patients/me/summary');
  // Replace static stat card numbers with data.stats
  document.getElementById('stat-appts').textContent = data.stats.upcoming_count;
  document.getElementById('stat-referrals').textContent = data.stats.active_referrals;
  // etc.
}

// Example: send navigator message
async function sendChat() {
  const text = document.getElementById('chatInp').value.trim();
  const { message } = await apiPost('/navigator/message', { text, language: 'ig' });
  addMsg(message.text, 'nav');
}

// Example: book appointment
async function confirmBooking(providerId, slot) {
  const appt = await apiPost('/appointments', {
    provider_id: providerId,
    scheduled_at: slot.datetime,
    type: 'specialist',
    language: 'ig'
  });
  toast('Booked!', `Ref ${appt.id.slice(0,8)}`, '📅');
}
```

---

## Deployment

### Render (recommended — free tier available)

1. Push repo to GitHub
2. New Web Service on render.com → connect repo
3. Build: `npm install` | Start: `npm start`
4. Add all env vars in the Render dashboard
5. Set `NODE_ENV=production`

### Railway

```bash
npm install -g @railway/cli
railway login
railway init
railway up
railway variables set SUPABASE_URL=... COHERE_API_KEY=... # etc.
```

### Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json .
RUN npm ci --only=production
COPY src/ src/
ENV NODE_ENV=production
EXPOSE 3001
CMD ["node", "src/index.js"]
```

```bash
docker build -t carecompass-api .
docker run -p 3001:3001 --env-file .env carecompass-api
```

---

## Running Tests

```bash
npm test               # run all tests
npm test -- --coverage # with coverage report
```

---

## Security Notes

- `SUPABASE_SERVICE_KEY` bypasses RLS — **never** expose it to the frontend
- All patient data access is gated by Supabase RLS policies
- Rate limiting: 100 req/min global, 20 req/min on AI endpoints
- OHIP numbers should be encrypted at rest (use `pgcrypto` extension in production)
- Enable Supabase's built-in audit logging for PHIPA/PIPEDA compliance
