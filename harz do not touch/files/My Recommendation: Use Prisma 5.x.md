

## 🎯 **My Recommendation: Use Prisma 5.x**

Prisma 7 is too new and documentation/tutorials still use v5. Let's stick with **Prisma 5.22.0** for now.

### **Complete Fix (Step by Step)**

```bash
# 1. Go to apps/api
cd apps/api

# 2. Remove Prisma 7
pnpm remove prisma @prisma/client

# 3. Install Prisma 5.22.0 (last stable v5 release)
pnpm add -D prisma@5.22.0
pnpm add @prisma/client@5.22.0

# 4. Remove existing prisma folder
rm -rf prisma

# 5. Initialize Prisma (this will now work)
pnpm exec prisma init

# 6. You'll see:
# ✔ Your Prisma schema was created at prisma/schema.prisma
# ✔ .env file was created
```

---

## 📄 **Now Add Your Full Schema**

After `prisma init` works, replace the contents of `prisma/schema.prisma` with this:

```prisma
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
  clerkId         String    @unique
  
  email           String?   @unique
  phone           String    @unique
  phoneVerified   Boolean   @default(false)
  
  firstName       String
  lastName        String
  avatar          String?
  
  role            UserRole  @default(TENANT)
  status          UserStatus @default(ACTIVE)
  
  verified        Boolean   @default(false)
  verifiedAt      DateTime?
  
  idType          String?
  idNumber        String?
  idDocumentUrl   String?
  
  propertiesOwned Property[]           @relation("LandlordProperties")
  favorites       Favorite[]
  transactions    Transaction[]
  reviews         Review[]
  sentMessages    Message[]            @relation("SentMessages")
  receivedMessages Message[]           @relation("ReceivedMessages")
  viewHistory     PropertyView[]
  
  lastLoginAt     DateTime?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  deletedAt       DateTime?
  
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
  
  title           String
  description     String    @db.Text
  
  address         String
  city            String
  state           String
  country         String    @default("Nigeria")
  zipCode         String?
  
  latitude        Float?
  longitude       Float?
  
  propertyType    PropertyType
  bedrooms        Int
  bathrooms       Int
  toilets         Int
  parkingSpaces   Int       @default(0)
  floorArea       Float?
  
  pricePerYear    Int
  agentFee        Int       @default(0)
  cautionFee      Int       @default(0)
  legalFee        Int       @default(0)
  serviceFee      Int       @default(0)
  
  paymentTerms    PaymentTerms @default(TWO_YEARS)
  negotiable      Boolean   @default(false)
  
  furnished       Boolean   @default(false)
  serviced        Boolean   @default(false)
  petsAllowed     Boolean   @default(false)
  
  powerSupply     PowerSupply @default(GRID_ONLY)
  waterSupply     WaterSupply @default(BOREHOLE)
  
  status          PropertyStatus @default(AVAILABLE)
  featured        Boolean   @default(false)
  verified        Boolean   @default(false)
  verifiedAt      DateTime?
  verifiedBy      String?
  
  landlordId      String
  landlord        User      @relation("LandlordProperties", fields: [landlordId], references: [id], onDelete: Cascade)
  
  images          Image[]
  videos          Video[]
  amenities       PropertyAmenity[]
  favorites       Favorite[]
  transactions    Transaction[]
  reviews         Review[]
  views           PropertyView[]
  messages        Message[]
  
  viewCount       Int       @default(0)
  avgRating       Float?
  reviewCount     Int       @default(0)
  
  publishedAt     DateTime?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  deletedAt       DateTime?
  
  @@index([landlordId])
  @@index([city, state])
  @@index([status])
  @@index([propertyType])
  @@index([pricePerYear])
  @@index([bedrooms])
  @@index([featured])
  @@index([verified])
  @@index([latitude, longitude])
  @@index([createdAt])
  @@map("properties")
}

enum PropertyType {
  SELF_CONTAIN
  ROOM_AND_PARLOUR
  MINI_FLAT
  APARTMENT_2BED
  APARTMENT_3BED
  APARTMENT_4BED
  DUPLEX
  BUNGALOW
  DETACHED_HOUSE
  SEMI_DETACHED
  TERRACE
  PENTHOUSE
  STUDIO
}

enum PropertyStatus {
  DRAFT
  PENDING_REVIEW
  AVAILABLE
  UNDER_OFFER
  RENTED
  UNAVAILABLE
  ARCHIVED
}

enum PaymentTerms {
  ONE_YEAR
  TWO_YEARS
  THREE_YEARS
  FLEXIBLE
}

enum PowerSupply {
  GRID_ONLY
  GRID_AND_GENERATOR
  GRID_AND_SOLAR
  GENERATOR_ONLY
  SOLAR_ONLY
  MIXED
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
  publicId    String
  width       Int?
  height      Int?
  format      String?
  size        Int?
  
  propertyId  String
  property    Property @relation(fields: [propertyId], references: [id], onDelete: Cascade)
  
  order       Int      @default(0)
  isPrimary   Boolean  @default(false)
  
  createdAt   DateTime @default(now())
  
  @@index([propertyId])
  @@index([isPrimary])
  @@map("images")
}

model Video {
  id          String   @id @default(cuid())
  url         String
  publicId    String
  duration    Int?
  thumbnail   String?
  
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
  icon        String?
  category    AmenityCategory
  
  properties  PropertyAmenity[]
  
  createdAt   DateTime @default(now())
  
  @@index([category])
  @@map("amenities")
}

enum AmenityCategory {
  SECURITY
  UTILITIES
  FACILITIES
  CONNECTIVITY
  PARKING
  KITCHEN
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
// TRANSACTIONS
// ============================================

model Transaction {
  id              String    @id @default(cuid())
  
  tenantId        String
  tenant          User      @relation(fields: [tenantId], references: [id])
  
  propertyId      String
  property        Property  @relation(fields: [propertyId], references: [id])
  
  rentAmount      Int
  agentFee        Int       @default(0)
  cautionFee      Int       @default(0)
  legalFee        Int       @default(0)
  platformFee     Int
  totalAmount     Int
  
  paymentMethod   PaymentMethod
  paymentGateway  PaymentGateway
  
  paystackRef     String?   @unique
  flutterwaveRef  String?   @unique
  
  status          TransactionStatus @default(PENDING)
  
  escrowHeld      Boolean   @default(true)
  escrowReleased  Boolean   @default(false)
  releaseDate     DateTime?
  releaseReason   String?
  
  leaseStartDate  DateTime?
  leaseEndDate    DateTime?
  leaseDuration   Int?
  
  refunded        Boolean   @default(false)
  refundAmount    Int?
  refundDate      DateTime?
  refundReason    String?
  
  metadata        Json?
  
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
  PENDING
  PROCESSING
  SUCCESSFUL
  FAILED
  CANCELLED
  REFUNDED
  ESCROWED
  RELEASED
}

// ============================================
// REVIEWS
// ============================================

model Review {
  id          String   @id @default(cuid())
  
  rating      Int
  
  locationRating    Int?
  valueRating       Int?
  conditionRating   Int?
  landlordRating    Int?
  
  comment     String?  @db.Text
  
  propertyId  String
  property    Property @relation(fields: [propertyId], references: [id], onDelete: Cascade)
  
  reviewerId  String
  reviewer    User     @relation(fields: [reviewerId], references: [id], onDelete: Cascade)
  
  verified    Boolean  @default(false)
  
  flagged     Boolean  @default(false)
  flagReason  String?
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@unique([propertyId, reviewerId])
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
  
  senderId    String
  sender      User     @relation("SentMessages", fields: [senderId], references: [id], onDelete: Cascade)
  
  receiverId  String
  receiver    User     @relation("ReceivedMessages", fields: [receiverId], references: [id], onDelete: Cascade)
  
  propertyId  String?
  property    Property? @relation(fields: [propertyId], references: [id], onDelete: SetNull)
  
  content     String   @db.Text
  
  read        Boolean  @default(false)
  readAt      DateTime?
  
  attachments Json?
  
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
  
  ipAddress   String?
  userAgent   String?
  referrer    String?
  
  sessionId   String?
  duration    Int?
  
  createdAt   DateTime @default(now())
  
  @@index([propertyId])
  @@index([userId])
  @@index([createdAt])
  @@map("property_views")
}

// ============================================
// NOTIFICATIONS
// ============================================

model Notification {
  id          String   @id @default(cuid())
  
  userId      String
  
  type        NotificationType
  title       String
  message     String   @db.Text
  
  actionUrl   String?
  actionText  String?
  
  read        Boolean  @default(false)
  readAt      DateTime?
  
  sentVia     String?
  delivered   Boolean  @default(false)
  deliveredAt DateTime?
  
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

## 🚀 **Now Run the Migration**

```bash
# Generate Prisma Client
pnpm exec prisma generate

# Create the database and tables
pnpm exec prisma migrate dev --name init

# (Optional) Open Prisma Studio to view your database
pnpm exec prisma studio
```

---

## ✅ **Updated Package Versions**

Your `apps/api/package.json` should now have:

```json
{
  "dependencies": {
    "@prisma/client": "5.22.0"
  },
  "devDependencies": {
    "prisma": "5.22.0"
  }
}
```

