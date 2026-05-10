# Spacefit

Indian-first fitness tracking + B2B gym SaaS. Multi-tenant. AI-powered.

**Stack:** React 19 + TS (Vite) · Node.js + Express + TS · PostgreSQL (Supabase) · Prisma · TanStack Query · Zustand · Recharts · Anthropic/Gemini/Groq AI

---

## Quick start

### 1. Install
```bash
npm install
```

### 2. Configure environment
```bash
cp apps/api/.env.example apps/api/.env
# Edit apps/api/.env — at minimum set DATABASE_URL + DIRECT_URL from Supabase
```

Required env vars:
| Var | Purpose |
|-----|---------|
| `DATABASE_URL` | Supabase pooled connection (port 6543) |
| `DIRECT_URL` | Supabase direct (port 5432) — used for migrations |
| `JWT_SECRET` | ≥32 chars |
| `JWT_REFRESH_SECRET` | ≥32 chars |
| `B2C_TRIAL_DAYS` | Default 30 |

Optional (AI calorie/exercise estimation):
| Var | Purpose |
|-----|---------|
| `ANTHROPIC_API_KEY` | Claude Haiku 4.5 — best Indian-food accuracy |
| `GEMINI_API_KEY` | Free tier 1M tokens/day |
| `GROQ_API_KEY` | Free tier 14k req/day, fastest |
| `AI_PROVIDER` | `anthropic` \| `gemini` \| `groq` (auto-fallback if blank) |
| `AI_MODEL` | Override default model |

WhatsApp/SMS/Email (sim mode without keys):
| Var | Purpose |
|-----|---------|
| `WHATSAPP_PHONE_NUMBER_ID` + `WHATSAPP_ACCESS_TOKEN` | Meta Cloud API |
| `TWILIO_ACCOUNT_SID` + `TWILIO_AUTH_TOKEN` + `TWILIO_FROM_NUMBER` | SMS |
| `RESEND_API_KEY` + `EMAIL_FROM` | Email |

### 3. Run migrations
```bash
cd apps/api
npm run db:migrate     # creates tables
npm run db:seed        # inserts 82 Indian foods + 66 exercises
npm run db:studio      # optional: opens DB browser at localhost:5555
```

### 4. Start dev servers
From repo root:
```bash
npm run dev            # starts both API (4000) + web (5173)
```

Or separately:
```bash
npm run dev --workspace=apps/api
npm run dev --workspace=apps/web
```

### 5. Open
- **App:** http://localhost:5173
- **API:** http://localhost:4000
- **Prisma Studio:** http://localhost:5555 (after `db:studio`)

---

## Project structure

```
apps/
├── web/                  React PWA — client + admin + master portals
│   └── src/
│       ├── App.tsx       Router (3 portals: /master /admin /client)
│       ├── lib/          API clients, auth, axios setup
│       ├── store/        Zustand
│       ├── components/   ui/ shared, ProtectedRoute, PortalRouter
│       └── pages/        Per-portal screens
│
└── api/                  Node.js + Express
    ├── prisma/
    │   ├── schema.prisma     16+ tables: User, Org, Foods, Exercises, etc.
    │   ├── seed-foods.ts     82 Indian foods (ICMR-NIN)
    │   └── seed-exercises.ts 66 exercises (gym + bodyweight + cardio + yoga)
    └── src/
        ├── index.ts       Express + role-gated routes
        ├── lib/           env, prisma client
        ├── middleware/    auth, RBAC, org scoping
        ├── services/      Business logic (auth, calorie, workout, streak, AI...)
        └── routes/        auth, master, admin, client

packages/shared/          Shared types
```

---

## Migrations

### Run pending migrations
```bash
cd apps/api
npm run db:migrate
```

This runs `prisma migrate dev` which:
1. Diffs `schema.prisma` vs DB
2. Creates new migration file in `apps/api/prisma/migrations/`
3. Applies migration
4. Regenerates Prisma client

### Create a new migration after schema change
```bash
cd apps/api
npx prisma migrate dev --name describe_what_changed
```

### Reset DB (destructive — wipes data)
```bash
npx prisma migrate reset
```

### Apply migrations in production
```bash
cd apps/api
npx prisma migrate deploy
```

### View DB
```bash
npm run db:studio
```

---

## Seed data

```bash
npm run db:seed              # everything
npm run db:seed:foods        # 82 Indian foods only
npm run db:seed:exercises    # 66 exercises only
```

Idempotent — re-running skips duplicates.

---

## Common gotchas

### Supabase "Tenant or user not found"
Pooler (port 6543) on a fresh project may take 5-10 min to register users. Workaround: use direct connection (port 5432) for `DATABASE_URL` until it works. Switch back to pooler before production scale.

### Supabase "Can't reach database server"
Free-tier projects auto-pause after ~1 week inactivity. Wake from dashboard.

### Password contains `@`
URL-encode as `%40`. Or regenerate password to alphanumeric only.

### Migration error after schema change
Run `npx prisma generate` to refresh TS client types.

---

## Feature status

| Phase | Status |
|-------|--------|
| 0 — Scaffold + 3-portal routing | ✅ |
| 1 — Auth + RBAC + DB schema | ✅ |
| 2 — Member + Trainer + Dashboard | ✅ |
| 3 — Subscriptions (B2B + B2C trial) | ✅ |
| 4 — Notifications (WhatsApp/SMS/Email) | ✅ |
| 5 — Calorie tracker + AI hybrid | ✅ |
| 5.1 — Edit logs, recent foods, trainer adds members, conversion leaderboard | ✅ |
| 5.2 — UX restructure (bottom nav, calorie ring, FAB, 4-step onboarding, streaks) | ✅ |
| 6 — Workout tracker | 🟡 in progress |
| 7 — Goals + analytics | ⏸ |
| 8 — Polish + security audit | ⏸ |

---

## Architecture decisions

See `DESIGN_REFERENCE.md` for UX patterns, visual system, and research-backed component specs.

See `PENDING.md` for actions you (the user) need to do externally (set up Supabase, get API keys, etc.).

See `~/.claude/projects/-Users-harshit-Desktop-Healthfit/memory/spacefit_implementation_progress.md` for detailed phase-by-phase progress notes.

---

## Deployment (when ready)

- **Frontend:** Vercel (free tier ok for MVP) → `apps/web`
- **Backend:** Railway or Render → `apps/api`
- **DB:** Supabase (already set up)
- **Notifications:** Set up real keys for WhatsApp Cloud API + Resend
- **Domain:** Buy + point at Vercel

Production checklist:
- [ ] Rotate `JWT_SECRET` + `JWT_REFRESH_SECRET` to strong random values
- [ ] Switch `DATABASE_URL` back to pooled connection
- [ ] Add `connection_limit=20` query param
- [ ] Run `npx prisma migrate deploy` (not `migrate dev`) on prod
- [ ] Set `NODE_ENV=production`
- [ ] Configure CORS allowlist
- [ ] Add Sentry / observability
- [ ] Rate limit on auth endpoints

---

## Testing the app

### B2C flow (individual user)
1. http://localhost:5173 → "Get started" → "I want to track my fitness"
2. Pick goal → fill stats (skippable) → create account
3. Land on home → calorie ring + meal timeline
4. Tap **+** FAB → quick-add bottom sheet
5. Open Food tab → search/AI/manual log

### B2B flow (gym owner)
1. http://localhost:5173 → "Get started" → "I manage a gym"
2. Fill personal + gym info
3. Land on /admin → Members, Plans, Subscriptions, Notifications, Conversions

### Trainer flow (B2B)
1. As gym owner: /admin/trainers/new → add trainer
2. Logout → log back in as trainer (use temp password shown)
3. /admin/members/new → add member (auto-assigned to you)
4. Logout, log in as owner → /admin/conversions → see your trainer's count

### Smoke test all
```bash
cd apps/api
bash /tmp/smoke52.sh    # if file exists, otherwise rerun manually
```

---

## License

Private. © Harshit Yadav 2026.
