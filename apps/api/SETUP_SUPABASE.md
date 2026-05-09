# Supabase Setup (5 minutes)

## 1. Create project

1. Go to https://supabase.com/dashboard
2. Click **New Project**
3. Name: `spacefit-dev`
4. DB password: generate a strong one — **save it**
5. Region: closest to you (Mumbai/Singapore for India)
6. Wait ~2 min for provisioning

## 2. Copy connection strings

In the project dashboard:

1. Go to **Project Settings → Database**
2. Scroll to **Connection string** section
3. Copy **Connection pooling** (Transaction mode) — used for app
4. Copy **Direct connection** — used for migrations

## 3. Update `.env`

Replace `DATABASE_URL` with the pooled connection string. Add `DIRECT_URL` for migrations:

```
DATABASE_URL="postgresql://postgres.xxx:PASSWORD@aws-x-region.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.xxx:PASSWORD@aws-x-region.pooler.supabase.com:5432/postgres"
```

## 4. Run migration

```bash
cd apps/api
npx prisma migrate dev --name init
npx prisma generate
```

## 5. Verify

```bash
npx prisma studio
```

Opens DB browser at http://localhost:5555

## Done

DB is live. Tell Claude when complete and we continue Phase 1.
