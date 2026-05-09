# Spacefit — Pending User Actions

Things only you can do. Code is ready and waiting on these.

---

## 🔴 Critical (blocks testing)

### 1. Supabase database setup
**Why blocking:** Nothing runs without DB.

- [ ] Create Supabase project at https://supabase.com/dashboard
  - Name: `spacefit-dev`
  - Region: Mumbai or Singapore
  - Save the DB password
- [ ] Copy connection strings into `apps/api/.env`:
  - `DATABASE_URL` (Connection pooling, Transaction mode, port 6543)
  - `DIRECT_URL` (Direct connection, port 5432)
- [ ] Run migrations:
  ```bash
  cd apps/api
  npm run db:migrate -- --name init
  npm run db:generate
  ```
- [ ] Seed Indian foods:
  ```bash
  npm run db:seed
  ```
- [ ] Verify: `npm run db:studio` (opens Prisma Studio at localhost:5555)

Full guide: `apps/api/SETUP_SUPABASE.md`

---

## 🟡 Recommended (unlocks features)

### 2. AI provider key (for calorie estimation)
**Without this, manual entry still works but no AI.**

Pick ONE:
- [ ] **Gemini (FREE, recommended)** — https://aistudio.google.com/app/apikey
  - 1M tokens/day free = ~14k AI food lookups
  - Add to `.env`: `GEMINI_API_KEY=AIza...`
- [ ] **Groq (FREE alternative)** — https://console.groq.com/keys
  - 14k req/day free, super fast
  - Add to `.env`: `GROQ_API_KEY=gsk_...`
- [ ] **Anthropic (PAID, best Indian-food accuracy)** — https://console.anthropic.com/
  - $5 free credit, then ~$30/mo at 10k users
  - Add to `.env`: `ANTHROPIC_API_KEY=sk-ant-...`

You can configure multiple — system auto-fallbacks.

### 3. WhatsApp Business API (B2B notifications)
**Without this, runs in simulation mode (logs only).**

- [ ] Create Meta Business account: https://business.facebook.com/
- [ ] Set up WhatsApp Business Cloud API
- [ ] Get phone number + access token
- [ ] Add to `.env`:
  - `WHATSAPP_PHONE_NUMBER_ID=...`
  - `WHATSAPP_ACCESS_TOKEN=...`

Full setup guide: https://developers.facebook.com/docs/whatsapp/cloud-api/get-started

### 4. SMS fallback (Twilio)
- [ ] Sign up: https://www.twilio.com/
- [ ] Buy India-SMS-enabled number (~$1/mo)
- [ ] Add to `.env`:
  - `TWILIO_ACCOUNT_SID=AC...`
  - `TWILIO_AUTH_TOKEN=...`
  - `TWILIO_FROM_NUMBER=+1...`

### 5. Email (Resend)
- [ ] Sign up: https://resend.com/ (3k emails/month free)
- [ ] Verify your domain
- [ ] Add to `.env`:
  - `RESEND_API_KEY=re_...`
  - `EMAIL_FROM="Spacefit <noreply@yourdomain.com>"`

---

## 🟢 Nice-to-have (post-MVP)

### 6. Domain + SSL
- [ ] Buy domain (e.g. spacefit.in or spacefit.app — ~₹800/yr)
- [ ] Point to deployment (Vercel for frontend, Railway/Render for backend)
- [ ] SSL is auto-handled by both platforms

### 7. Production hosting
- [ ] **Frontend:** Deploy `apps/web` to Vercel (free tier ok for MVP)
- [ ] **Backend:** Deploy `apps/api` to Railway (~$5/mo) or Render (free tier)
- [ ] Set production env vars (different from `.env`)
- [ ] Set up GitHub repo + auto-deploy on push

### 8. Razorpay (B2C/B2B payments — Phase 9)
- [ ] Sign up: https://razorpay.com/
- [ ] KYC + bank account verification (~3 days)
- [ ] Get API keys (test + live)
- [ ] Add to `.env` when implementing payments phase

### 9. Error monitoring (Sentry)
- [ ] Sign up: https://sentry.io/ (free tier 5k errors/mo)
- [ ] Add SDK to both apps
- [ ] Catch production bugs before users complain

### 10. Analytics (PostHog or Plausible)
- [ ] PostHog (free 1M events/mo) — full product analytics
- [ ] Or Plausible (~$9/mo) — lighter, privacy-friendly
- [ ] Wire into frontend for funnel tracking

---

## 🟦 Decisions to make (no urgency)

- [ ] Logo + brand identity (can use placeholder for now)
- [ ] Privacy policy + terms of service URLs
- [ ] Pricing for B2C premium tier (currently placeholder: ₹299/mo)
- [ ] Pricing for B2B gym software (research suggests ₹3,000-5,000/mo)
- [ ] Customer support channel (WhatsApp Business? Discord? email?)
- [ ] Refund policy
- [ ] Data export format (CSV? JSON?)

---

## ⚪ Future phases (no action needed yet)

- Phase 6: Workout tracker
- Phase 7: Goals + health analytics
- Phase 8: Polish + security audit
- Phase 9+: Native mobile apps, payments, multi-language

---

## How to know what to do next

1. Want to **test the app right now**? → Do #1 (Supabase) + #2 (any free AI key) → tell Claude
2. Want to **send real WhatsApp**? → Do #3
3. Want to **deploy publicly**? → Do #6 + #7
4. Everything else → keep building features, do these when relevant
