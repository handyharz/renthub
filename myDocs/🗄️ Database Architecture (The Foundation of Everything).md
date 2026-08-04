# 🗄️ Database Architecture (The Foundation of Everything)

This is where **everything starts**. Get this right, and the rest flows naturally. Get it wrong, and you'll be doing painful migrations later.

Let me design this like we're building for **10 million users**, not just MVP.

---

## 🎯 **Design Principles**

Before we write any schema:

### **1. Optimize for Queries You'll Run Most**

- ❌ Don't design for "perfect normalization"
- ✅ Design for **real-world usage patterns**

**Example:**

- "Show me all available 2-bedroom apartments in Abuja under ₦3M/year"
- "Show landlord's properties with transaction history"
- "Find properties within 5km of a location"

### **2. Plan for Scale**

- Indexes on frequently queried fields
- Avoid N+1 queries (use proper relations)
- Denormalize when it makes sense

### **3. Data Integrity**

- Foreign keys (maintain relationships)
- Constraints (prevent bad data)
- Enums (limit valid values)

### **4. Auditability**

- Track who did what, when
- Soft deletes (never lose data)
- Transaction logs

---

## 📊 **Entity Relationship Diagram (ERD)**

Let me show you the **big picture** first:

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│    User     │────────>│   Property   │<────────│    Image    │
│             │ owns    │              │ has     │             │
│ - id        │         │ - id         │         │ - id        │
│ - email     │         │ - title      │         │ - url       │
│ - phone     │         │ - price      │         │ - publicId  │
│ - role      │         │ - bedrooms   │         └─────────────┘
└──────┬──────┘         └───────┬──────┘
       │                        │
       │ creates                │ part of
       │                        │
       ▼                        ▼
┌─────────────┐         ┌──────────────┐
│ Transaction │         │   Amenity    │
│             │         │              │
│ - id        │         │ - id         │
│ - amount    │         │ - name       │
│ - status    │         │ - icon       │
└─────────────┘         └──────────────┘
       │
       │ triggers
       ▼
┌─────────────┐         ┌──────────────┐
│   Review    │         │  Favorite    │
│             │         │              │
│ - id        │         │ - userId     │
│ - rating    │         │ - propertyId │
│ - comment   │         └──────────────┘
└─────────────┘
```

---

## 📋 **Complete Prisma Schema**

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================
// USERS
// ============================================

model User {
  id              String    @id @default(cuid())
  clerkId         String    @unique // Clerk user ID

  // Contact Info
  email           String?   @unique
  phone           String    @unique
  phoneVerified   Boolean   @default(false)

  // Profile
  firstName       String
  lastName        String
  avatar          String?

  // Role & Status
  role            UserRole  @default(TENANT)
  status          UserStatus @default(ACTIVE)

  // Verification
  verified        Boolean   @default(false)
  verifiedAt      DateTime?

  // KYC Documents
  idType          String?   // "NIN", "Voter's Card", "Driver's License"
  idNumber        String?
  idDocumentUrl   String?

  // Relations
  propertiesOwned Property[]           @relation("LandlordProperties")
  favorites       Favorite[]
  transactions    Transaction[]
  reviews         Review[]
  sentMessages    Message[]            @relation("SentMessages")
  receivedMessages Message[]           @relation("ReceivedMessages")
  viewHistory     PropertyView[]

  // Metadata
  lastLoginAt     DateTime?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  deletedAt       DateTime? // Soft delete

  @@index([clerkId])
  @@index([email])
  @@index([phone])
  @@index([role])
  @@index([createdAt])
  @@map("users")
}

enum UserRole {
  TENANT
  LANDLORD
  AGENT
  ADMIN
}

enum UserStatus {
  ACTIVE
  SUSPENDED
  BANNED
}

// ============================================
// PROPERTIES
// ============================================

model Property {
  id              String    @id @default(cuid())

  // Basic Info
  title           String
  description     String    @db.Text

  // Location
  address         String
  city            String
  state           String
  country         String    @default("Nigeria")
  zipCode         String?

  // Geolocation
  latitude        Float?
  longitude       Float?

  // Property Details
  propertyType    PropertyType
  bedrooms        Int
  bathrooms       Int
  toilets         Int
  parkingSpaces   Int       @default(0)
  floorArea       Float?    // in square meters

  // Pricing
  pricePerYear    Int       // Annual rent
  agentFee        Int       @default(0)
  cautionFee      Int       @default(0) // Security deposit
  legalFee        Int       @default(0)
  serviceFee      Int       @default(0)

  // Payment Terms
  paymentTerms    PaymentTerms @default(TWO_YEARS) // New standard
  negotiable      Boolean   @default(false)

  // Features
  furnished       Boolean   @default(false)
  serviced        Boolean   @default(false) // Includes cleaning, security, etc.
  petsAllowed     Boolean   @default(false)

  // Utilities
  powerSupply     PowerSupply @default(GRID_ONLY)
  waterSupply     WaterSupply @default(BOREHOLE)

  // Status
  status          PropertyStatus @default(AVAILABLE)
  featured        Boolean   @default(false)
  verified        Boolean   @default(false)
  verifiedAt      DateTime?
  verifiedBy      String?   // Admin user ID

  // Ownership
  landlordId      String
  landlord        User      @relation("LandlordProperties", fields: [landlordId], references: [id], onDelete: Cascade)

  // Relations
  images          Image[]
  videos          Video[]
  amenities       PropertyAmenity[]
  favorites       Favorite[]
  transactions    Transaction[]
  reviews         Review[]
  views           PropertyView[]
  messages        Message[]

  // Metadata
  views           Int       @default(0) // Denormalized for performance
  avgRating       Float?    // Denormalized
  reviewCount     Int       @default(0) // Denormalized

  publishedAt     DateTime?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  deletedAt       DateTime? // Soft delete

  @@index([landlordId])
  @@index([city, state])
  @@index([status])
  @@index([propertyType])
  @@index([pricePerYear])
  @@index([bedrooms])
  @@index([featured])
  @@index([verified])
  @@index([latitude, longitude]) // Geospatial queries
  @@index([createdAt])
  @@fulltext([title, description, address]) // Full-text search
  @@map("properties")
}

enum PropertyType {
  SELF_CONTAIN       // Single room with toilet/bath
  ROOM_AND_PARLOUR   // 1 living room + 1 bedroom
  MINI_FLAT          // 1 bedroom flat
  APARTMENT_2BED     // 2 bedroom apartment
  APARTMENT_3BED     // 3 bedroom apartment
  APARTMENT_4BED     // 4+ bedroom apartment
  DUPLEX
  BUNGALOW
  DETACHED_HOUSE
  SEMI_DETACHED
  TERRACE
  PENTHOUSE
  STUDIO
}

enum PropertyStatus {
  DRAFT              // Created but not published
  PENDING_REVIEW     // Awaiting verification
  AVAILABLE          // Ready to rent
  UNDER_OFFER        // Someone is negotiating
  RENTED             // Currently occupied
  UNAVAILABLE        // Temporarily off market
  ARCHIVED           // Historical record
}

enum PaymentTerms {
  ONE_YEAR
  TWO_YEARS
  THREE_YEARS
  FLEXIBLE           // Negotiable
}

enum PowerSupply {
  GRID_ONLY
  GRID_AND_GENERATOR
  GRID_AND_SOLAR
  GENERATOR_ONLY
  SOLAR_ONLY
  MIXED              // All of the above
}

enum WaterSupply {
  BOREHOLE
  TREATED_WATER
  BOTH
  TANK_ONLY
}

// ============================================
// MEDIA
// ============================================

model Image {
  id          String   @id @default(cuid())
  url         String
  publicId    String   // Cloudinary public ID
  width       Int?
  height      Int?
  format      String?  // jpg, png, webp, etc.
  size        Int?     // File size in bytes

  propertyId  String
  property    Property @relation(fields: [propertyId], references: [id], onDelete: Cascade)

  order       Int      @default(0) // Display order
  isPrimary   Boolean  @default(false) // Main thumbnail

  createdAt   DateTime @default(now())

  @@index([propertyId])
  @@index([isPrimary])
  @@map("images")
}

model Video {
  id          String   @id @default(cuid())
  url         String
  publicId    String   // Cloudinary public ID
  duration    Int?     // Duration in seconds
  thumbnail   String?  // Video thumbnail URL

  propertyId  String
  property    Property @relation(fields: [propertyId], references: [id], onDelete: Cascade)

  createdAt   DateTime @default(now())

  @@index([propertyId])
  @@map("videos")
}

// ============================================
// AMENITIES
// ============================================

model Amenity {
  id          String   @id @default(cuid())
  name        String   @unique
  icon        String?  // Icon name or URL
  category    AmenityCategory

  properties  PropertyAmenity[]

  createdAt   DateTime @default(now())

  @@index([category])
  @@map("amenities")
}

enum AmenityCategory {
  SECURITY       // Gated estate, security guard, CCTV
  UTILITIES      // Water, power backup, waste disposal
  FACILITIES     // Gym, pool, playground, elevator
  CONNECTIVITY   // WiFi, cable TV
  PARKING        // Covered parking, garage
  KITCHEN        // Modern kitchen, gas cooker
  OTHER
}

model PropertyAmenity {
  propertyId  String
  property    Property @relation(fields: [propertyId], references: [id], onDelete: Cascade)

  amenityId   String
  amenity     Amenity  @relation(fields: [amenityId], references: [id], onDelete: Cascade)

  @@id([propertyId, amenityId])
  @@map("property_amenities")
}

// ============================================
// FAVORITES
// ============================================

model Favorite {
  id          String   @id @default(cuid())

  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  propertyId  String
  property    Property @relation(fields: [propertyId], references: [id], onDelete: Cascade)

  createdAt   DateTime @default(now())

  @@unique([userId, propertyId])
  @@index([userId])
  @@index([propertyId])
  @@map("favorites")
}

// ============================================
// RENTAL APPLICATIONS & TRANSACTIONS
// ============================================

model RentalApplication {
  id                 String            @id @default(cuid())
  propertyId         String
  tenantId           String
  landlordId         String
  status             ApplicationStatus @default(PENDING)
  proposedMoveInDate DateTime
  leaseDuration      Int               @default(12) // In months
  note               String?
  createdAt          DateTime          @default(now())
  updatedAt          DateTime          @updatedAt
  landlord           User              @relation("LandlordApplications", fields: [landlordId], references: [id], onDelete: Cascade)
  property           Property          @relation(fields: [propertyId], references: [id], onDelete: Cascade)
  tenant             User              @relation("TenantApplications", fields: [tenantId], references: [id], onDelete: Cascade)
  transactions       Transaction[]

  @@index([propertyId])
  @@index([tenantId])
  @@index([landlordId])
  @@index([status])
  @@map("rental_applications")
}

enum ApplicationStatus {
  PENDING
  APPROVED
  REJECTED
  CANCELLED
}

model Transaction {
  id              String    @id @default(cuid())

  // Parties & Relations
  tenantId        String
  tenant          User      @relation(fields: [tenantId], references: [id])
  propertyId      String
  property        Property  @relation(fields: [propertyId], references: [id])
  applicationId   String?
  application     RentalApplication? @relation(fields: [applicationId], references: [id])

  // Amounts
  rentAmount      Int       // Annual rent
  agentFee        Int       @default(0)
  cautionFee      Int       @default(0)
  legalFee        Int       @default(0)
  platformFee     Int       // 2% RentHub fee
  totalAmount     Int       // Sum of all fees

  // Payment Details
  paymentMethod   PaymentMethod
  paymentGateway  PaymentGateway

  // Gateway References
  paystackRef     String?   @unique
  flutterwaveRef  String?   @unique

  // Status
  status          TransactionStatus @default(PENDING)

  // Escrow & OTP Handover
  escrowHeld      Boolean   @default(true)
  escrowReleased  Boolean   @default(false)
  releaseDate     DateTime?
  releaseReason   String?
  releaseOtp      String?   // 6-digit handover OTP sent to tenant
  otpExpiresAt    DateTime? // 24-hour OTP expiration window
  disputed        Boolean   @default(false) // Escrow dispute lock flag
  disputeReason   String?   // Reason provided by tenant

  // Lease Details
  leaseStartDate  DateTime?
  leaseEndDate    DateTime?
  leaseDuration   Int?      // In months

  // Refund (if applicable)
  refunded        Boolean   @default(false)
  refundAmount    Int?
  refundDate      DateTime?
  refundReason    String?

  // Metadata
  metadata        Json?     // Store additional payment data

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@index([tenantId])
  @@index([propertyId])
  @@index([status])
  @@index([paymentGateway])
  @@index([createdAt])
  @@map("transactions")
}

enum PaymentMethod {
  CARD
  BANK_TRANSFER
  USSD
  BANK_ACCOUNT
}

enum PaymentGateway {
  PAYSTACK
  FLUTTERWAVE
}

enum TransactionStatus {
  PENDING         // Payment initiated
  PROCESSING      // Payment in progress
  SUCCESSFUL      // Payment confirmed
  FAILED          // Payment failed
  CANCELLED       // User cancelled
  REFUNDED        // Money returned
  ESCROWED        // Held in escrow
  RELEASED        // Released to landlord
}

// ============================================
// REVIEWS & RATINGS
// ============================================

model Review {
  id          String   @id @default(cuid())

  // Rating (1-5 stars)
  rating      Int      // Overall rating

  // Specific ratings (optional, for detailed feedback)
  locationRating    Int?
  valueRating       Int?
  conditionRating   Int?
  landlordRating    Int?

  // Text review
  comment     String?  @db.Text

  // Relations
  propertyId  String
  property    Property @relation(fields: [propertyId], references: [id], onDelete: Cascade)

  reviewerId  String
  reviewer    User     @relation(fields: [reviewerId], references: [id], onDelete: Cascade)

  // Verification
  verified    Boolean  @default(false) // Did they actually rent?

  // Moderation
  flagged     Boolean  @default(false)
  flagReason  String?

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([propertyId, reviewerId]) // One review per user per property
  @@index([propertyId])
  @@index([reviewerId])
  @@index([rating])
  @@map("reviews")
}

// ============================================
// MESSAGING
// ============================================

model Message {
  id          String   @id @default(cuid())

  // Parties
  senderId    String
  sender      User     @relation("SentMessages", fields: [senderId], references: [id], onDelete: Cascade)

  receiverId  String
  receiver    User     @relation("ReceivedMessages", fields: [receiverId], references: [id], onDelete: Cascade)

  // Context
  propertyId  String?
  property    Property? @relation(fields: [propertyId], references: [id], onDelete: SetNull)

  // Content
  content     String   @db.Text

  // Status
  read        Boolean  @default(false)
  readAt      DateTime?

  // Metadata
  attachments Json?    // Array of attachment URLs

  createdAt   DateTime @default(now())

  @@index([senderId])
  @@index([receiverId])
  @@index([propertyId])
  @@index([createdAt])
  @@map("messages")
}

// ============================================
// ANALYTICS
// ============================================

model PropertyView {
  id          String   @id @default(cuid())

  propertyId  String
  property    Property @relation(fields: [propertyId], references: [id], onDelete: Cascade)

  userId      String?
  user        User?    @relation(fields: [userId], references: [id], onDelete: SetNull)

  // Tracking
  ipAddress   String?
  userAgent   String?
  referrer    String?

  // Session
  sessionId   String?
  duration    Int?     // Time spent viewing (in seconds)

  createdAt   DateTime @default(now())

  @@index([propertyId])
  @@index([userId])
  @@index([createdAt])
  @@map("property_views")
}

// ============================================
// ADMIN & MODERATION
// ============================================

model VerificationRequest {
  id          String   @id @default(cuid())

  propertyId  String   @unique

  // Verification details
  requestedBy String   // Landlord user ID
  status      VerificationStatus @default(PENDING)

  // Admin review
  reviewedBy  String?  // Admin user ID
  reviewedAt  DateTime?
  notes       String?  @db.Text

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([status])
  @@map("verification_requests")
}

enum VerificationStatus {
  PENDING
  APPROVED
  REJECTED
  REQUIRES_CHANGES
}

// ============================================
// NOTIFICATIONS (For Future SMS/Email)
// ============================================

model Notification {
  id          String   @id @default(cuid())

  userId      String

  type        NotificationType
  title       String
  message     String   @db.Text

  // Action
  actionUrl   String?
  actionText  String?

  // Status
  read        Boolean  @default(false)
  readAt      DateTime?

  // Delivery
  sentVia     String?  // "SMS", "EMAIL", "PUSH"
  delivered   Boolean  @default(false)
  deliveredAt DateTime?

  // Metadata
  metadata    Json?

  createdAt   DateTime @default(now())

  @@index([userId])
  @@index([read])
  @@index([createdAt])
  @@map("notifications")
}

enum NotificationType {
  NEW_PROPERTY      // New property in saved search
  PRICE_DROP        // Price reduced on favorited property
  MESSAGE           // New message received
  PAYMENT_SUCCESS   // Payment confirmed
  PAYMENT_FAILED    // Payment failed
  REVIEW_REQUEST    // Ask tenant to review
  VERIFICATION      // Property verified
  LEASE_EXPIRING    // Lease ending soon
  SYSTEM            // System announcements
}
```

---

## 🎯 **Key Design Decisions Explained**

### **1. Why `clerkId` AND `id`?**

```prisma
model User {
  id      String @id @default(cuid())  // Our internal ID
  clerkId String @unique               // Clerk's ID
}
```

**Reason:**

- ✅ Decouple from auth provider (can switch from Clerk later)
- ✅ Our ID stays stable if we migrate
- ✅ Clerk ID for auth, our ID for relationships

---

### **2. Why Soft Deletes (`deletedAt`)?**

```prisma
deletedAt DateTime? // Soft delete
```

**Reason:**

- ✅ Never lose data (can restore)
- ✅ Audit trail (know what was deleted, when)
- ✅ Legal compliance (may need to recover)

**Query with soft delete:**

```typescript
// Only active users
const users = await prisma.user.findMany({
  where: { deletedAt: null },
});
```

---

### **3. Why Denormalize `views`, `avgRating`?**

```prisma
model Property {
  views       Int   @default(0)
  avgRating   Float?
  reviewCount Int   @default(0)
}
```

**Reason:**

- ✅ Faster queries (no JOIN or COUNT)
- ✅ Homepage shows "1.2K views, 4.5★" instantly
- ✅ Update via background job (BullMQ)

---

### **4. Why Store Prices in Kobo (smallest unit)?**

```prisma
pricePerYear Int // Store as Kobo (₦3,000,000 = 300,000,000 kobo)
```

**Reason:**

- ✅ Avoid floating-point errors
- ✅ Paystack/Flutterwave use Kobo
- ✅ Integer math is precise

**Display:**

```typescript
const priceInNaira = priceInKobo / 100;
// 300000000 kobo = ₦3,000,000
```

---

### **5. Why `PropertyAmenity` Join Table?**

```prisma
model PropertyAmenity {
  propertyId String
  amenityId  String
  @@id([propertyId, amenityId])
}
```

**Reason:**

- ✅ Many-to-many (property has many amenities, amenity belongs to many properties)
- ✅ Can add fields later (e.g., amenityCondition, notes)
- ✅ Efficient queries

---

### **6. Why Full-Text Search Index?**

```prisma
@@fulltext([title, description, address])
```

**Reason:**

- ✅ Fast search without external service (Algolia)
- ✅ Postgres full-text search is powerful
- ✅ Good enough for 100K+ properties

**Query:**

```typescript
const results = await prisma.property.findMany({
  where: {
    OR: [
      { title: { search: "abuja 2 bedroom" } },
      { description: { search: "abuja 2 bedroom" } },
    ],
  },
});
```

---

### **7. Why Separate `Image` and `Video` Models?**

```prisma
model Image { ... }
model Video { ... }
```

**Reason:**

- ✅ Different fields (video has duration, thumbnail)
- ✅ Different processing (video transcoding)
- ✅ Clearer queries

---

## 📈 **Indexes Explained**

### **Property Indexes:**

```prisma
@@index([city, state])       // Search by location
@@index([pricePerYear])      // Filter by price
@@index([bedrooms])          // Filter by size
@@index([status])            // Show only available
@@index([latitude, longitude]) // Geospatial (near me)
```

**Why these?**

- These are the **most common filters** users will use
- Without indexes, queries on 100K+ properties = slow
- With indexes, queries = milliseconds

---

## 🔐 **Data Integrity Rules**

### **Foreign Key Constraints:**

```prisma
landlord User @relation(..., onDelete: Cascade)
```

**Cascade Delete:**

- Delete user → delete their properties
- Delete property → delete its images, favorites, etc.

**Set Null:**

```prisma
property Property? @relation(..., onDelete: SetNull)
```

- Delete property → keep messages, but clear property link

---

## 🚀 **Migration Strategy**

### **Step 1: Initialize Prisma**

```bash
cd apps/api
npx prisma init
```

### **Step 2: Copy Schema**

Copy the full schema above into `prisma/schema.prisma`

### **Step 3: First Migration**

```bash
npx prisma migrate dev --name init
```

This creates:

- All tables
- All indexes
- All constraints

### **Step 4: Generate Prisma Client**

```bash
npx prisma generate
```

Now you can use:

```typescript
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
```

---

## 🌱 **Seed Data (Optional but Recommended)**

Create `prisma/seed.ts`:

```typescript
import { PrismaClient } from "@prisma/client";
import { AmenityCategory } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Seed amenities
  const amenities = [
    { name: "Gated Estate", category: AmenityCategory.SECURITY },
    { name: "24hr Security", category: AmenityCategory.SECURITY },
    { name: "CCTV", category: AmenityCategory.SECURITY },
    { name: "Generator", category: AmenityCategory.UTILITIES },
    { name: "Solar Power", category: AmenityCategory.UTILITIES },
    { name: "Borehole", category: AmenityCategory.UTILITIES },
    { name: "Swimming Pool", category: AmenityCategory.FACILITIES },
    { name: "Gym", category: AmenityCategory.FACILITIES },
    { name: "Playground", category: AmenityCategory.FACILITIES },
    { name: "Elevator", category: AmenityCategory.FACILITIES },
    { name: "WiFi", category: AmenityCategory.CONNECTIVITY },
    { name: "Cable TV", category: AmenityCategory.CONNECTIVITY },
    { name: "Covered Parking", category: AmenityCategory.PARKING },
    { name: "Garage", category: AmenityCategory.PARKING },
  ];

  for (const amenity of amenities) {
    await prisma.amenity.upsert({
      where: { name: amenity.name },
      update: {},
      create: amenity,
    });
  }

  console.log("✅ Seeded amenities");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

**Run seed:**

```bash
npx prisma db seed
```

---

## ✅ **What We Just Built**

1. ✅ **13 core tables** (User, Property, Image, Transaction, etc.)
2. ✅ **Proper relationships** (one-to-many, many-to-many)
3. ✅ **Strategic indexes** (fast queries on filters users actually use)
4. ✅ **Data integrity** (foreign keys, constraints, enums)
5. ✅ **Scalable design** (denormalization where needed)
6. ✅ **Audit trail** (soft deletes, timestamps)
7. ✅ **Full-text search** (built-in PostgreSQL)
8. ✅ **Future-proof** (notification system, analytics ready)

---

## 🎯 **Next Step**

Now that we have:

1. ✅ Project structure
2. ✅ Database architecture

We move to:

## **#3: Development Roadmap**

This will be your **execution plan**:

- What to build first (MVP features)
- What to build second (growth features)
- What to build later (scale features)
- Timeline estimates
- Milestones
