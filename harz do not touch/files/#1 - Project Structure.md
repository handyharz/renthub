
## 📋 The Build Order (Why This Sequence Matters)

```
1. Project Structure          ← Organize everything cleanly
2. Database Architecture      ← Data is your foundation
3. Prisma Schema             ← Turn architecture into code
4. Development Roadmap        ← Know what to build when
5. First API Endpoint         ← Start shipping features
```

**Why this order?**
- ❌ If you start coding without structure → refactor hell later
- ❌ If you build APIs before DB design → schema rewrites destroy you
- ✅ If you design data first → everything flows naturally

---

## 🚀 **Let's Start: #1 - Project Structure**

This determines **how easy it is to add features, collaborate, and scale**.

---

## 📁 **Complete Project Structure**

```
renthub/
├── apps/
│   ├── web/                          # Next.js 14 Frontend
│   │   ├── app/
│   │   │   ├── (auth)/
│   │   │   │   ├── sign-in/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── sign-up/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── verify/
│   │   │   │       └── page.tsx
│   │   │   │
│   │   │   ├── (platform)/
│   │   │   │   ├── layout.tsx        # Shared layout (nav, footer)
│   │   │   │   ├── page.tsx          # Homepage (search + featured)
│   │   │   │   │
│   │   │   │   ├── properties/
│   │   │   │   │   ├── page.tsx      # Browse all properties
│   │   │   │   │   ├── [id]/
│   │   │   │   │   │   └── page.tsx  # Property detail
│   │   │   │   │   └── search/
│   │   │   │   │       └── page.tsx  # Search results
│   │   │   │   │
│   │   │   │   ├── landlord/
│   │   │   │   │   ├── dashboard/
│   │   │   │   │   │   └── page.tsx  # Landlord overview
│   │   │   │   │   ├── properties/
│   │   │   │   │   │   ├── page.tsx  # My properties
│   │   │   │   │   │   ├── new/
│   │   │   │   │   │   │   └── page.tsx  # Create property
│   │   │   │   │   │   └── [id]/
│   │   │   │   │   │       └── edit/
│   │   │   │   │   │           └── page.tsx  # Edit property
│   │   │   │   │   └── transactions/
│   │   │   │   │       └── page.tsx  # Payment history
│   │   │   │   │
│   │   │   │   └── tenant/
│   │   │   │       ├── dashboard/
│   │   │   │       │   └── page.tsx  # Tenant overview
│   │   │   │       ├── favorites/
│   │   │   │       │   └── page.tsx  # Saved properties
│   │   │   │       └── applications/
│   │   │   │           └── page.tsx  # Rental applications
│   │   │   │
│   │   │   ├── api/                  # API routes (if needed)
│   │   │   │   └── webhooks/
│   │   │   │       ├── clerk/
│   │   │   │       │   └── route.ts  # Clerk webhooks
│   │   │   │       └── paystack/
│   │   │   │           └── route.ts  # Payment webhooks
│   │   │   │
│   │   │   ├── layout.tsx            # Root layout
│   │   │   └── globals.css           # Global styles
│   │   │
│   │   ├── components/
│   │   │   ├── ui/                   # shadcn/ui components
│   │   │   │   ├── button.tsx
│   │   │   │   ├── input.tsx
│   │   │   │   ├── card.tsx
│   │   │   │   └── ... (all shadcn components)
│   │   │   │
│   │   │   ├── properties/
│   │   │   │   ├── PropertyCard.tsx
│   │   │   │   ├── PropertyGrid.tsx
│   │   │   │   ├── PropertyFilters.tsx
│   │   │   │   ├── PropertyDetail.tsx
│   │   │   │   └── PropertyForm.tsx
│   │   │   │
│   │   │   ├── search/
│   │   │   │   ├── SearchBar.tsx
│   │   │   │   ├── FilterPanel.tsx
│   │   │   │   └── MapView.tsx
│   │   │   │
│   │   │   ├── layout/
│   │   │   │   ├── Navbar.tsx
│   │   │   │   ├── Footer.tsx
│   │   │   │   └── Sidebar.tsx
│   │   │   │
│   │   │   └── shared/
│   │   │       ├── ImageUpload.tsx
│   │   │       ├── LoadingSpinner.tsx
│   │   │       └── ErrorBoundary.tsx
│   │   │
│   │   ├── lib/
│   │   │   ├── api.ts                # API client (calls backend)
│   │   │   ├── utils.ts              # Utility functions
│   │   │   ├── validations.ts        # Form validations
│   │   │   └── constants.ts          # App constants
│   │   │
│   │   ├── hooks/
│   │   │   ├── useProperties.ts
│   │   │   ├── useAuth.ts
│   │   │   └── usePayments.ts
│   │   │
│   │   ├── types/
│   │   │   ├── property.ts
│   │   │   ├── user.ts
│   │   │   └── transaction.ts
│   │   │
│   │   ├── public/
│   │   │   ├── images/
│   │   │   └── icons/
│   │   │
│   │   ├── .env.local
│   │   ├── next.config.js
│   │   ├── tailwind.config.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   └── api/                          # Express Backend
│       ├── src/
│       │   ├── index.ts              # Entry point
│       │   │
│       │   ├── config/
│       │   │   ├── database.ts       # Prisma client
│       │   │   ├── redis.ts          # Redis connection
│       │   │   ├── cloudinary.ts     # Cloudinary config
│       │   │   └── env.ts            # Environment variables
│       │   │
│       │   ├── routes/
│       │   │   ├── index.ts          # Route aggregator
│       │   │   ├── properties.ts     # Property routes
│       │   │   ├── users.ts          # User routes
│       │   │   ├── transactions.ts   # Transaction routes
│       │   │   ├── search.ts         # Search routes
│       │   │   └── webhooks.ts       # Webhook handlers
│       │   │
│       │   ├── controllers/
│       │   │   ├── propertyController.ts
│       │   │   ├── userController.ts
│       │   │   ├── transactionController.ts
│       │   │   ├── searchController.ts
│       │   │   └── webhookController.ts
│       │   │
│       │   ├── services/
│       │   │   ├── propertyService.ts     # Business logic
│       │   │   ├── userService.ts
│       │   │   ├── paymentService.ts
│       │   │   ├── smsService.ts          # Termii integration
│       │   │   ├── uploadService.ts       # Cloudinary
│       │   │   └── searchService.ts
│       │   │
│       │   ├── middleware/
│       │   │   ├── auth.ts                # Clerk verification
│       │   │   ├── validate.ts            # Request validation
│       │   │   ├── errorHandler.ts
│       │   │   └── rateLimiter.ts
│       │   │
│       │   ├── validators/
│       │   │   ├── propertyValidator.ts
│       │   │   ├── userValidator.ts
│       │   │   └── transactionValidator.ts
│       │   │
│       │   ├── jobs/                      # BullMQ jobs
│       │   │   ├── emailJobs.ts
│       │   │   ├── smsJobs.ts
│       │   │   ├── imageJobs.ts
│       │   │   └── analyticsJobs.ts
│       │   │
│       │   ├── utils/
│       │   │   ├── logger.ts
│       │   │   ├── errors.ts
│       │   │   └── helpers.ts
│       │   │
│       │   └── types/
│       │       ├── express.d.ts
│       │       └── index.ts
│       │
│       ├── prisma/
│       │   ├── schema.prisma
│       │   ├── migrations/
│       │   └── seed.ts
│       │
│       ├── tests/
│       │   ├── unit/
│       │   ├── integration/
│       │   └── e2e/
│       │
│       ├── .env
│       ├── .env.example
│       ├── tsconfig.json
│       └── package.json
│
├── packages/                         # Shared code
│   ├── types/                        # Shared TypeScript types
│   │   ├── property.ts
│   │   ├── user.ts
│   │   └── index.ts
│   │
│   └── config/                       # Shared configs
│       ├── eslint-config/
│       └── typescript-config/
│
├── .gitignore
├── package.json                      # Root package.json (workspaces)
├── pnpm-workspace.yaml               # Monorepo config
├── turbo.json                        # Turborepo config
└── README.md
```

---

## 🧩 **Why This Structure?**

### **1. Monorepo (apps/ + packages/)**
- ✅ Frontend and backend in one repo
- ✅ Share types between frontend/backend
- ✅ Single command deploys everything
- ✅ Easier to maintain consistency

### **2. Clean Separation**
- Frontend (`apps/web`) = UI only
- Backend (`apps/api`) = Business logic + data
- Shared (`packages/`) = Common code

### **3. Scalable Architecture**
- Easy to add new features
- Clear where each file goes
- New developers onboard fast

### **4. Production-Ready**
- Proper error handling
- Background jobs separated
- Middleware organized
- Tests structured

---

## 📦 **Package Manager: pnpm (Recommended)**

**Why pnpm?**
- ✅ Faster than npm/yarn
- ✅ Saves disk space (shared dependencies)
- ✅ Better for monorepos
- ✅ Strict (catches errors early)

**Install:**
```bash
npm install -g pnpm
```

---

## 🚀 **Initial Setup Commands**

### **Step 1: Create Root Structure**

```bash
# Create project directory
mkdir renthub
cd renthub

# Initialize pnpm workspace
pnpm init

# Create workspace config
cat > pnpm-workspace.yaml << EOF
packages:
  - 'apps/*'
  - 'packages/*'
EOF
```

### **Step 2: Create Frontend (Next.js)**

```bash
# Create apps directory
mkdir -p apps

# Create Next.js app
cd apps
pnpm create next-app@latest web \
  --typescript \
  --tailwind \
  --app \
  --src-dir false \
  --import-alias "@/*"

cd web

# Install shadcn/ui
pnpm dlx shadcn-ui@latest init

# Install dependencies
pnpm add @clerk/nextjs mapbox-gl axios
pnpm add -D @types/mapbox-gl
```

### **Step 3: Create Backend (Express)**

```bash
# Go back to apps/
cd ../

# Create backend structure
mkdir -p api/src/{config,routes,controllers,services,middleware,validators,jobs,utils,types}
cd api

# Initialize package.json
pnpm init

# Install dependencies
pnpm add express cors helmet dotenv
pnpm add @prisma/client prisma
pnpm add @clerk/backend
pnpm add bullmq ioredis
pnpm add cloudinary
pnpm add axios

# Install dev dependencies
pnpm add -D typescript @types/node @types/express @types/cors
pnpm add -D tsx nodemon
pnpm add -D prisma

# Initialize TypeScript
pnpx tsc --init
```

### **Step 4: Create Shared Packages**

```bash
# Go back to root
cd ../../

# Create shared types package
mkdir -p packages/types
cd packages/types
pnpm init

# Install TypeScript
pnpm add -D typescript

# Create tsconfig
cat > tsconfig.json << EOF
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "declaration": true,
    "outDir": "./dist",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "moduleResolution": "node"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
EOF
```

---

## 📄 **Key Configuration Files**

### **Root `package.json`**

```json
{
  "name": "renthub",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "test": "turbo run test",
    "lint": "turbo run lint"
  },
  "devDependencies": {
    "turbo": "^1.11.0"
  }
}
```

### **`turbo.json`** (Monorepo task runner)

```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {},
    "test": {
      "dependsOn": ["build"]
    }
  }
}
```

### **Frontend `.env.local`** (apps/web/.env.local)

```env
# Clerk (Authentication)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# API
NEXT_PUBLIC_API_URL=http://localhost:5000

# Mapbox
NEXT_PUBLIC_MAPBOX_TOKEN=pk.ey...
```

### **Backend `.env`** (apps/api/.env)

```env
# Server
NODE_ENV=development
PORT=5000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/renthub

# Clerk
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...

# Redis
REDIS_URL=redis://localhost:6379

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Payments
PAYSTACK_SECRET_KEY=sk_test_...
PAYSTACK_PUBLIC_KEY=pk_test_...
FLUTTERWAVE_SECRET_KEY=FLWSECK_TEST-...
FLUTTERWAVE_PUBLIC_KEY=FLWPUBK_TEST-...

# SMS
TERMII_API_KEY=TL...
TERMII_SENDER_ID=RentHub

# App
FRONTEND_URL=http://localhost:3000
```

---

## 🗂️ **Backend Entry Point** (apps/api/src/index.ts)

```typescript
import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', routes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`);
  logger.info(`📍 Environment: ${process.env.NODE_ENV}`);
});
```

---

## 📝 **Development Scripts**

### **Frontend `package.json`** scripts:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  }
}
```

### **Backend `package.json`** scripts:

```json
{
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:studio": "prisma studio"
  }
}
```

---

## ✅ **Verification Checklist**

After setup, you should have:

```
✅ Root directory with pnpm-workspace.yaml
✅ apps/web (Next.js frontend)
✅ apps/api (Express backend)
✅ packages/types (shared types)
✅ turbo.json (monorepo config)
✅ All dependencies installed
✅ TypeScript configured
✅ Environment variables set up
```

---

## 🎯 **What We Just Accomplished**

1. ✅ **Clean monorepo structure** (easy to scale)
2. ✅ **Proper separation of concerns** (frontend/backend/shared)
3. ✅ **Production-ready folder organization**
4. ✅ **TypeScript everywhere** (type safety)
5. ✅ **Development environment ready**

---

## 🚀 **Next Step**

Now that structure is done, we move to:

## **#2: Database Architecture**

This is where we design:
- All tables and relationships
- Indexes for performance
- Data integrity rules
- Migration strategy

**Should I proceed with the detailed database architecture now?**

This will include:
- Complete entity-relationship diagram
- All tables with fields and types
- Relationships (one-to-many, many-to-many)
- Indexes for fast queries
- Constraints and validations

**Ready for #2?** 🔥