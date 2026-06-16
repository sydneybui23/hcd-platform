# Compass — Setup Guide

## 1. Supabase Project

1. Go to [supabase.com](https://supabase.com) → New project
2. Copy your **Project URL** and **anon key** from Settings → API
3. Copy your **service role key** (keep this secret — server-only)
4. In the SQL Editor, run the full contents of `supabase/schema.sql`

## 2. Anthropic API Key

1. Go to [console.anthropic.com](https://console.anthropic.com) → API Keys → New key

## 3. Stripe (optional for MVP, required for billing)

1. Go to [dashboard.stripe.com](https://dashboard.stripe.com)
2. Create a product called "Compass Pro" with a recurring price of $49/month
3. Copy the **Price ID** and add it as `STRIPE_PRO_PRICE_ID` in `.env.local`
4. Copy your publishable key, secret key, and webhook secret

## 4. Environment Variables

Fill in `hcd-platform/.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

ANTHROPIC_API_KEY=sk-ant-...

STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_PRO_PRICE_ID=price_...

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 5. Run Locally

```bash
cd hcd-platform
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 6. Stripe Webhooks (local testing)

```bash
npm install -g stripe
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

## Architecture

```
Landing page       /
Sign up / Login    /signup  /login
Dashboard          /dashboard
New project        /dashboard/projects/new
HCD workspace      /projects/[id]/phases/[1-8]
Public feedback    /f/[token]          ← no account needed
```

## What's Built (Month 1 scope)

- [x] Full Next.js + Supabase + Tailwind scaffold
- [x] Auth (email/password, magic link ready)
- [x] Auto org + user creation on signup (DB trigger)
- [x] Scope of work intake form → new project
- [x] All 8 HCD phase AI facilitators (Claude streaming)
- [x] Split chat + canvas UI for each phase
- [x] Phase progress tracking + gated navigation
- [x] Public feedback portal (no account, shareable link)
- [x] Feedback synthesis API (Claude merges all responses)
- [x] Execution plan generator API
- [x] Stripe billing scaffold (checkout + webhooks)
- [x] Row-level security on all tables
- [x] Full DB schema with triggers

## Next Steps (Month 2)

- [ ] Feedback link management UI (`/projects/[id]/feedback`)
- [ ] Synthesis view (`/projects/[id]/synthesis`)
- [ ] Execution plan view (`/projects/[id]/execution`)
- [ ] PDF export
- [ ] Billing/upgrade UI
