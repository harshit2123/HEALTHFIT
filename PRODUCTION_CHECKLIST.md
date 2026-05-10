# Production Deployment Checklist

Walk through this before shipping to real users. Don't skip.

---

## 🔒 Security (MUST DO)

### Secrets
- [ ] `JWT_SECRET` — generate fresh 64+ char random string. Never reuse from dev.
  - `openssl rand -base64 64`
- [ ] `JWT_REFRESH_SECRET` — different from `JWT_SECRET`. Same generation.
- [ ] `DATABASE_URL` — production Supabase project, not dev. Strong DB password (no special chars).
- [ ] **Rotate the Anthropic API key** that was visible in the dev session.
  - https://console.anthropic.com/settings/keys → revoke old, create new
- [ ] All `.env` files **never committed to git**. Verify `.gitignore` covers `.env`, `.env.local`, `.env.production`.
- [ ] No real keys in `.env.example` — only placeholders.

### Database
- [ ] Switch `DATABASE_URL` to Supabase **transaction pooler** (port 6543).
  - Add `?pgbouncer=true&connection_limit=20` query params.
- [ ] Keep `DIRECT_URL` on direct connection (port 5432) — only for migrations.
- [ ] Run `npx prisma migrate deploy` (NOT `migrate dev`) on prod.
- [ ] Verify Supabase RLS policies are in place (or rely on app-level RBAC).
- [ ] Set up automated backups (Supabase free tier has daily backups).

### Auth
- [ ] `NODE_ENV=production` set — env validation enforces strong secrets, refuses to start otherwise.
- [ ] `BCRYPT_SALT_ROUNDS=12` minimum (already default).
- [ ] Refresh token rotation works (already implemented).
- [ ] Rate limit on `/api/auth/login` and `/api/auth/register`: 5/15min ✅
- [ ] Per-user API rate limit: 200/min ✅

### CORS
- [ ] `CORS_ORIGINS` env var set to production domain(s) — comma-separated, e.g. `https://spacefit.in,https://app.spacefit.in`.
- [ ] **NEVER** use `origin: '*'` in production.

### CSP (Content Security Policy)
- [ ] Helmet auto-applies CSP in production (already configured in `index.ts`).
- [ ] Verify allowed `connectSrc` covers all third-party APIs you actually use.

### Provider Keys
- [ ] WhatsApp Cloud API: production phone number + verified business
- [ ] Twilio: production-grade SMS plan + India-enabled number
- [ ] Resend: verified sending domain + DKIM/SPF/DMARC records
- [ ] Anthropic: paid tier or rate limits sufficient

---

## 📊 Observability

- [ ] Sentry SDK installed in both `apps/web` + `apps/api`
- [ ] `SENTRY_DSN` env vars set
- [ ] Source maps uploaded for stack traces
- [ ] Error rate alerts configured (>1%/min triggers PagerDuty/Slack)
- [ ] Health check endpoint `/api/health` integrated into Render/Railway uptime monitor
- [ ] Log aggregation: Logtail / Datadog / Better Stack or similar
- [ ] `console.log` calls replaced with structured logger before launch

---

## ⚡ Performance

### Bundle
- [ ] Production build minified: `npm run build --workspace=apps/web`
- [ ] Verify `dist/` size < 300kb gzipped
- [ ] Code split per route (Vite does this auto)
- [ ] Recharts loaded only on Progress page (route-level chunk)

### Database
- [ ] All foreign-key columns indexed (Prisma `@@index` already covers main ones)
- [ ] Slow query log enabled in Supabase dashboard
- [ ] No `findMany()` without `take` limit on user-scoped queries
- [ ] N+1 audit on member listings (Prisma `include` reasonably batched)

### API
- [ ] Response compression: add `compression()` middleware
- [ ] HTTP/2 enabled (Vercel/Railway do auto)
- [ ] Static assets cached at CDN

---

## 🧪 Pre-launch tests

### Manual smoke
- [ ] Sign up B2B → create plan → add member → assign sub → send notification (sim mode)
- [ ] Sign up B2C → log meal → log workout → log weight → create goal → check Progress page
- [ ] Login → logout → login again with refresh token rotation
- [ ] Test rate limit: 6 failed logins → 429 response
- [ ] Test CORS: hit API from different origin → blocked

### Automated
- [ ] All `npx tsc --noEmit` clean (web + api)
- [ ] No ESLint errors
- [ ] At least one happy-path E2E test per portal (Phase 9 add Playwright)

---

## 🚀 Deployment

### Frontend (Vercel)
- [ ] Connect GitHub repo
- [ ] Project root: `apps/web`
- [ ] Build command: `npm run build`
- [ ] Output: `dist`
- [ ] Env vars: `VITE_API_URL=https://api.spacefit.in`
- [ ] Domain: `spacefit.in` (or app subdomain)
- [ ] HTTPS auto-enabled
- [ ] Preview deployments on PRs

### Backend (Railway / Render)
- [ ] Root: `apps/api`
- [ ] Build: `npm install && npx prisma generate && npm run build`
- [ ] Start: `npm start`
- [ ] All env vars from `.env.example` set in dashboard
- [ ] Auto-deploy on `main` branch push
- [ ] Health check path: `/api/health`
- [ ] Min 2 instances for uptime

### Database (Supabase)
- [ ] Production project created (separate from dev)
- [ ] Migrations applied: `npx prisma migrate deploy`
- [ ] Seed prod data if needed: `npm run db:seed`
- [ ] Daily backups verified
- [ ] Connection pooling on transaction mode

### DNS
- [ ] `spacefit.in` → Vercel
- [ ] `api.spacefit.in` → Railway/Render
- [ ] SSL cert valid + auto-renewing

---

## 📝 Legal / Compliance

- [ ] Privacy policy live (`spacefit.in/privacy`)
- [ ] Terms of service (`spacefit.in/terms`)
- [ ] Cookie consent banner (if collecting analytics)
- [ ] Data export endpoint (GDPR right-to-portability)
- [ ] Account deletion endpoint (right-to-be-forgotten)
- [ ] DPA signed with Supabase + Anthropic + Razorpay

---

## 🚨 Day-1 monitoring

- [ ] Sentry dashboard pinned
- [ ] Supabase metrics dashboard pinned
- [ ] WhatsApp delivery rate dashboard pinned
- [ ] Customer support channel ready (Intercom / Crisp / WhatsApp Business)
- [ ] Status page: status.spacefit.in (statuspage.io free tier)
- [ ] Rollback plan tested (previous deployment redeployable in <5 min)

---

## 🔄 Incident playbook

| Incident | Action |
|----------|--------|
| API 5xx spike | Check Sentry → identify → rollback or hotfix |
| DB unreachable | Verify Supabase status page → check pooler conn limit |
| WhatsApp not sending | Check Meta Business → token expiry → re-auth |
| AI calorie estimation failing | Check Anthropic balance → fall back to Gemini if configured |
| Rate limit false-positives | Increase `apiLimiter.max` temporarily |
| Bad migration in prod | `npx prisma migrate resolve --rolled-back <name>` + investigate |
