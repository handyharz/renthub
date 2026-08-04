# 🚀 RentHub Deployment Guide

This document covers the full deployment of the RentHub monorepo:
- **Frontend (Web)** → [Vercel](https://vercel.com)
- **Backend (API)** → [Render](https://render.com)
- **Database** → [Neon Serverless PostgreSQL](https://neon.tech)

---

## 📁 Monorepo Structure

```
renthub/
├── apps/
│   ├── web/          ← Next.js 15 frontend (deployed to Vercel)
│   └── api/          ← Express.js backend (deployed to Render)
├── packages/
│   └── types/        ← Shared TypeScript types
├── pnpm-workspace.yaml
└── turbo.json
```

---

## 1. 🗄️ Database — Neon PostgreSQL

### Setup
1. Go to [neon.tech](https://neon.tech) → Create a new project
2. Copy the connection string: `postgresql://...@...neon.tech/neondb?sslmode=require`

### Apply Migrations
```bash
cd apps/api
npx prisma migrate deploy
```

### Current Neon Database
```
Host:     ep-wild-flower-aupzdtqq.c-10.us-east-1.aws.neon.tech
Database: neondb
User:     neondb_owner
SSL:      required
```

> ⚠️ Never commit the connection string. Store it as an environment variable only.

---

## 2. ⚙️ Backend — Render (Express API)

### Render Settings

| Setting | Value |
|---|---|
| **Service Type** | Web Service |
| **Repository** | `github.com/handyharz/renthub` |
| **Branch** | `main` |
| **Root Directory** | `apps/api` |
| **Runtime** | Node |
| **Build Command** | `npm run build` *(runs `prisma generate && tsc`)* |
| **Start Command** | `npm run start:prod` *(runs `prisma migrate deploy && tsx src/index.ts`)* |
| **Node Version** | `20` |
| **Auto-Deploy** | Yes (on push to `main`) |

### Environment Variables (Render)

Set all of these in **Render → Environment**:

```env
NODE_ENV=production
PORT=5001

# Database (Neon)
DATABASE_URL=postgresql://neondb_owner:<password>@ep-wild-flower-aupzdtqq.c-10.us-east-1.aws.neon.tech/neondb?sslmode=require

# Clerk Auth
CLERK_SECRET_KEY=sk_live_...
CLERK_WEBHOOK_SECRET=whsec_...

# Cloudinary (Image Uploads)
CLOUDINARY_URL=cloudinary://<api_key>:<api_secret>@dvxcbslna
CLOUDINARY_CLOUD_NAME=dvxcbslna
CLOUDINARY_API_KEY=594561313288511
CLOUDINARY_API_SECRET=<your_secret>

# Payments
PAYSTACK_SECRET_KEY=sk_live_...
PAYSTACK_PUBLIC_KEY=pk_live_...
FLUTTERWAVE_SECRET_KEY=FLWSECK_LIVE-...
FLUTTERWAVE_PUBLIC_KEY=FLWPUBK_LIVE-...

# SMS — Termii
TERMII_API_KEY=<your_key>
TERMII_SECRET_KEY=<your_secret>
TERMII_BASE_URL=https://v3.api.termii.com
TERMII_SENDER_ID=RentHub

# App
FRONTEND_URL=https://renthub.vercel.app
```

### Recommended Start Command (auto-runs migrations on deploy)
```
npx prisma migrate deploy && npx tsx src/index.ts
```

### After Deploy
Copy your Render API URL (e.g. `https://renthub-api.onrender.com`) → use it as `NEXT_PUBLIC_API_URL` in Vercel.

---

## 3. 🌐 Frontend — Vercel (Next.js)

### Vercel Settings

| Setting | Value |
|---|---|
| **Repository** | `github.com/handyharz/renthub` |
| **Branch** | `main` |
| **Framework** | Next.js (auto-detected) |
| **Root Directory** | *(leave blank — Vercel auto-detects via `apps/web`)* |
| **Build Command** | `pnpm --filter web build` |
| **Output Directory** | `apps/web/.next` |
| **Install Command** | `pnpm install` |

### Environment Variables (Vercel)

```env
# API URL — point to your Render deployment
NEXT_PUBLIC_API_URL=https://renthub-api.onrender.com/api

# Clerk Auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...

# Mapbox
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1...

# App
NEXT_PUBLIC_APP_URL=https://renthub.vercel.app
```

> ⚠️ Use `pk_live_` and `sk_live_` Clerk keys for production — not the `_test_` keys.

---

## 4. 🔑 Auth — Clerk

### Production Checklist
- [ ] Create a **Production** instance at [clerk.com](https://clerk.com)
- [ ] Replace all `pk_test_` / `sk_test_` keys with `pk_live_` / `sk_live_`
- [ ] Add your Vercel domain to **Clerk → Allowed Origins**
- [ ] Set up Clerk Webhook pointing to: `https://renthub-api.onrender.com/api/webhooks/clerk`

---

## 5. 🔄 Deploy Flow (Future Updates)

```bash
# 1. Make changes locally

# 2. Test build
pnpm --filter web build

# 3. Commit and push — triggers auto-deploy on both Vercel & Render
git add -A
git commit -m "feat: your change description"
git push origin main
```

Both Vercel and Render are set to **auto-deploy on push to `main`**.

---

## 6. 🗃️ Database — Schema Changes

Whenever you modify `apps/api/prisma/schema.prisma`:

```bash
# Create a new migration locally
cd apps/api
npx prisma migrate dev --name describe_your_change

# Commit and push — migration runs automatically on Render start
git add -A && git commit -m "db: add migration" && git push
```

> **Recommended Render Start Command:**
> ```
> npx prisma migrate deploy && npx tsx src/index.ts
> ```
> This ensures DB migrations run automatically on every deploy.

---

## 7. ✅ Post-Deployment Checklist

- [ ] Vercel frontend loads at your domain
- [ ] API health check: `GET https://renthub-api.onrender.com/api/health` → `{ success: true }`
- [ ] Sign-up / Sign-in works (Clerk)
- [ ] Property listings load (Neon DB connected)
- [ ] Image uploads work (Cloudinary)
- [ ] Admin panel accessible at `/admin` with `handyharz@gmail.com`
- [ ] Switch Clerk to **Production** keys before going live
- [ ] Switch Paystack / Flutterwave to **live** keys before going live

---

## 8. 🌍 Production URLs

| Service | URL |
|---|---|
| **Frontend** | https://renthub.vercel.app |
| **API** | https://renthub-api.onrender.com |
| **Database** | Neon — `ep-wild-flower-aupzdtqq.c-10.us-east-1.aws.neon.tech` |
| **Repo** | https://github.com/handyharz/renthub |

---

## 9. 🛠️ Local Development

```bash
# Clone
git clone https://github.com/handyharz/renthub.git
cd renthub

# Install all dependencies
pnpm install

# Create apps/api/.env with all required variables (see Section 2)
# Copy from .env.example if available

# Start everything
pnpm dev

# Frontend: http://localhost:3000
# API:      http://localhost:5001
```
