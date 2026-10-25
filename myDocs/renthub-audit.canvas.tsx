import {
  BarChart,
  Callout,
  Code,
  Divider,
  Grid,
  H1,
  H2,
  H3,
  PieChart,
  Pill,
  Row,
  Stack,
  Stat,
  Table,
  Text,
  TodoListCard,
  useCanvasState,
} from "cursor/canvas";

type Severity = "Critical" | "High" | "Medium" | "Low";
type Area = "Auth" | "Money" | "IDOR" | "Ops" | "Product" | "Data";

type Finding = {
  id: string;
  severity: Severity;
  area: Area;
  title: string;
  evidence: string;
  impact: string;
};

const FINDINGS: Finding[] = [
  {
    id: "C1",
    severity: "Critical",
    area: "Auth",
    title: "Spoofable identity via clerkId",
    evidence: "agentController.ts getClerkId prefers query; messages/favorites/verification/tours resolve clerkId without JWT",
    impact: "Anyone with a Clerk user id can act as that user on unauthenticated routes",
  },
  {
    id: "C2",
    severity: "Critical",
    area: "Auth",
    title: "Public POST /api/users accepts role",
    evidence: "routes/users.ts:14; userController.ts createUser 152–216",
    impact: "Unauthenticated create/update of users, including ADMIN",
  },
  {
    id: "C3",
    severity: "Critical",
    area: "Auth",
    title: "PATCH /api/users/me can set role",
    evidence: "userController.ts:111–126 spreads role from body",
    impact: "Any signed-in user can escalate to ADMIN in Postgres",
  },
  {
    id: "C4",
    severity: "Critical",
    area: "Auth",
    title: "Agent admin APIs are open",
    evidence: "routes/agents.ts:66–81 — no requireAuth / requireRole",
    impact: "Anyone can approve, reject, or suspend agents and read KPIs",
  },
  {
    id: "C5",
    severity: "Critical",
    area: "Money",
    title: "Legacy escrow release has no ownership check",
    evidence: "POST /transactions/:id/release; transactionController.ts:255–263",
    impact: "Any authenticated user can mark escrow RELEASED",
  },
  {
    id: "C6",
    severity: "Critical",
    area: "Money",
    title: "Client can PATCH transaction status",
    evidence: "transactionController.ts:226–235",
    impact: "Mark ESCROWED / SUCCESSFUL without a payment",
  },
  {
    id: "C7",
    severity: "Critical",
    area: "Money",
    title: "Paystack verify marks paid on provider failure",
    evidence: "GET /payments/verify/:reference public; paymentController.ts:123–170",
    impact: "Knowing a transaction id funds escrow without Paystack success",
  },
  {
    id: "C8",
    severity: "Critical",
    area: "Money",
    title: "AfriExchange webhook continues on bad HMAC",
    evidence: "paymentController.ts:429–440 logs mismatch then processes",
    impact: "Forged collection.completed events can escrow funds",
  },
  {
    id: "C9",
    severity: "Critical",
    area: "IDOR",
    title: "Conversation messages readable with no membership check",
    evidence: "routes/messages.ts:16; messageController.ts:145–155",
    impact: "Full inbox dump for any conversation id",
  },
  {
    id: "C10",
    severity: "Critical",
    area: "Money",
    title: "GET transaction returns releaseOtp",
    evidence: "transactionController.ts:118–134, 294–297; schema releaseOtp plaintext",
    impact: "Any authed user can read escrow OTP and PII",
  },
  {
    id: "H1",
    severity: "High",
    area: "IDOR",
    title: "Uploads have no auth or ownership",
    evidence: "routes/upload.ts:7–37",
    impact: "Overwrite avatars/ID docs; delete any property image",
  },
  {
    id: "H2",
    severity: "High",
    area: "Money",
    title: "Direct AfriExchange wallet link skips OTP",
    evidence: "PUT /payouts/link-afriexchange; payoutController.ts:187–210",
    impact: "Hijack landlord settlement destination, then auto-disburse",
  },
  {
    id: "H3",
    severity: "High",
    area: "IDOR",
    title: "Tour create uses body clerkId; status has no authz",
    evidence: "tourController.ts:9–21, 111–123",
    impact: "Book tours as another user; accept/cancel any tour",
  },
  {
    id: "H4",
    severity: "High",
    area: "IDOR",
    title: "sendMessage does not check conversation membership",
    evidence: "messageController.ts:74–91",
    impact: "Inject messages into other people’s threads",
  },
  {
    id: "H5",
    severity: "High",
    area: "Money",
    title: "AfriExchange verify is public; sim mode marks escrow",
    evidence: "payments.ts:13; afriExchangePaymentService.ts:480–490",
    impact: "Missing keys in prod fail open and complete rent without payment",
  },
  {
    id: "H6",
    severity: "High",
    area: "Auth",
    title: "/admin only requires a Clerk session",
    evidence: "middleware.ts:3–13; AdminGuard is client-side",
    impact: "Any signed-in user hits the admin shell; APIs must be the gate",
  },
  {
    id: "H7",
    severity: "High",
    area: "Data",
    title: "Prisma schema is ahead of committed migrations",
    evidence: "No CREATE TABLE for applications, agents, renewals, payouts; OTP columns missing from init SQL",
    impact: "prisma migrate deploy on a fresh DB will not match the app",
  },
  {
    id: "M1",
    severity: "Medium",
    area: "Auth",
    title: "Property ownership skipped when req.user is missing",
    evidence: "propertyController.ts:341–343, 375–377",
    impact: "Update/delete listings if JWT verifies but DB user is unsynced",
  },
  {
    id: "M2",
    severity: "Medium",
    area: "Auth",
    title: "Reviews take reviewerId from the body",
    evidence: "reviewController.ts:6–50",
    impact: "Spoof verified reviews for another account",
  },
  {
    id: "M3",
    severity: "Medium",
    area: "Money",
    title: "Handover OTP is 6 digits, plaintext, not timing-safe",
    evidence: "transactionService.ts:345–395; no rate limit on release-otp",
    impact: "Brute force or DB leak of the key-release code",
  },
  {
    id: "M4",
    severity: "Medium",
    area: "Ops",
    title: "CORS origin: true with credentials",
    evidence: "apps/api/src/index.ts:21–25",
    impact: "Any origin can call the API with cookies in a browser",
  },
  {
    id: "M5",
    severity: "Medium",
    area: "Money",
    title: "GET /:id registered before /tenant/all",
    evidence: "routes/transactions.ts:11–14",
    impact: "/transactions/tenant/all is treated as id=tenant",
  },
  {
    id: "M6",
    severity: "Medium",
    area: "Data",
    title: "Naira vs kobo mixed across tables",
    evidence: "Transaction/Property treated as naira; ServiceTransaction stores kobo",
    impact: "Wrong payouts or fee math under load",
  },
  {
    id: "M7",
    severity: "Medium",
    area: "Product",
    title: "48h listing lock and dispute window are not jobs",
    evidence: "BullMQ unused; adminService config unused by transactionService",
    impact: "UNDER_OFFER never expires; dispute SLA is marketing only",
  },
  {
    id: "M8",
    severity: "Medium",
    area: "Product",
    title: "Renewal payment path is unused",
    evidence: "RenewalStatus.PAID_IN_ESCROW never referenced in TS",
    impact: "Lease renewals cannot actually pay into escrow",
  },
  {
    id: "M9",
    severity: "Medium",
    area: "Ops",
    title: "start:prod runs tsx after migrate deploy",
    evidence: "apps/api/package.json:10; no CI workflows",
    impact: "Prod ignores dist/; no automated tests or lint on API",
  },
  {
    id: "M10",
    severity: "Medium",
    area: "Product",
    title: "Property marked RENTED on payment, before OTP",
    evidence: "transactionService.updateTransactionStatus SUCCESSFUL → RENTED",
    impact: "Trust chain stage 5 completes stage 7 early",
  },
  {
    id: "L1",
    severity: "Low",
    area: "Ops",
    title: "No API rate limiting or Zod/Joi",
    evidence: "helmet/cors only; multer trusts mimetype",
    impact: "SMS pumping, OTP guessing, oversized uploads",
  },
  {
    id: "L2",
    severity: "Low",
    area: "Ops",
    title: "Docs disagree with the repo",
    evidence: "README Next 14 vs Next 16; packages/database missing; no .env.example",
    impact: "Onboarding and deploy runbooks will fail",
  },
  {
    id: "L3",
    severity: "Low",
    area: "Data",
    title: "Notification.userId has no User FK",
    evidence: "schema.prisma Notification model",
    impact: "Orphan notifications; LandlordPayout also lacks Transaction relation",
  },
];

const FILTERS = ["All", "Critical", "High", "Medium", "Auth", "Money", "Product"] as const;
type Filter = (typeof FILTERS)[number];

const SEVERITY_TONE: Record<Severity, "danger" | "warning" | "info" | "neutral"> = {
  Critical: "danger",
  High: "warning",
  Medium: "info",
  Low: "neutral",
};

export default function RenthubAudit() {
  const [filter, setFilter] = useCanvasState<Filter>("filter", "All");

  const visible = FINDINGS.filter((f) => {
    if (filter === "All") return true;
    if (filter === "Critical" || filter === "High" || filter === "Medium") {
      return f.severity === filter;
    }
    return f.area === filter;
  });

  return (
    <Stack gap={24}>
      <Stack gap={8}>
        <H1>RentHub audit</H1>
        <Text tone="secondary">
          Static review of `apps/api` (Express + Prisma) and `apps/web` (Next.js 16 + Clerk), 25 Oct 2026. Escrow, identity, and admin paths were checked against source — not against a live staging attack.
        </Text>
      </Stack>

      <Callout tone="danger" title="Do not take real rent through this build">
        Identity is still partly `?clerkId=`. Escrow can be marked paid without a provider success, and a logged-in user can set `role: ADMIN`. Fix auth and money before any live listing in Abuja.
      </Callout>

      <Row gap={24} wrap>
        <Stat value="10" label="Critical findings" tone="danger" />
        <Stat value="7" label="High findings" tone="warning" />
        <Stat value="0" label="Automated tests" tone="danger" />
        <Stat value="~55%" label="Trust-chain coverage" tone="warning" />
      </Row>

      <Grid columns={2} gap={24}>
        <Stack gap={8}>
          <H3>Findings by severity</H3>
          <PieChart
            donut
            size={220}
            data={[
              { label: "Critical", value: 10, tone: "danger" },
              { label: "High", value: 7, tone: "warning" },
              { label: "Medium", value: 10, tone: "info" },
              { label: "Low", value: 3, tone: "neutral" },
            ]}
          />
          <Text size="small" tone="tertiary">
            Source: code review of renthub · 30 findings catalogued
          </Text>
        </Stack>
        <Stack gap={8}>
          <H3>Product flow completeness (%)</H3>
          <BarChart
            horizontal
            height={280}
            yMax={100}
            valueSuffix="%"
            categories={[
              "Search",
              "Verification pay",
              "Featured",
              "Applications",
              "Tours",
              "Agents",
              "OTP release",
              "Escrow",
              "Disputes",
              "Renewals",
            ]}
            series={[
              {
                name: "Implemented vs README / USER_GUIDE",
                data: [90, 80, 60, 60, 55, 50, 50, 45, 40, 25],
                tone: "info",
              },
            ]}
          />
          <Text size="small" tone="tertiary">
            Source: API + schema vs README trust chain · scored by implemented surface, not polish
          </Text>
        </Stack>
      </Grid>

      <Divider />

      <Stack gap={10}>
        <H2>Findings</H2>
        <Row gap={8} wrap>
          {FILTERS.map((f) => (
            <Pill key={f} active={filter === f} onClick={() => setFilter(f)}>
              {f}
            </Pill>
          ))}
        </Row>
        <Text size="small" tone="tertiary">
          Showing {visible.length} of {FINDINGS.length}
        </Text>
        <Table
          striped
          stickyHeader
          headers={["ID", "Sev", "Area", "Issue", "Where"]}
          columnAlign={["left", "left", "left", "left", "left"]}
          rowTone={visible.map((f) => SEVERITY_TONE[f.severity])}
          rows={visible.map((f) => [
            f.id,
            f.severity,
            f.area,
            <Stack gap={2} key={f.id}>
              <Text weight="semibold">{f.title}</Text>
              <Text size="small" tone="secondary">
                {f.impact}
              </Text>
            </Stack>,
            <Text size="small" tone="tertiary" key={`${f.id}-ev`}>
              {f.evidence}
            </Text>,
          ])}
        />
      </Stack>

      <Divider />

      <Stack gap={8}>
        <H2>What already holds</H2>
        <Text>
          Clerk JWT verification in `requireAuth` is real (`verifyToken` + suspended/banned block). `/api/admin` and payout admin routes use `requireRole("ADMIN")`. Platform fee is computed server-side at 2%. OTP-path release checks landlord vs tenant. Payouts have an idempotency key. Prisma ORM is used — no raw SQL found. Application approve and agent delegation checks landlord ownership in those services.
        </Text>
        <Callout tone="info" title="The dual identity model">
          Private routes that call `requireAuth` are mostly fine. Routes that still take `clerkId` from query or body as identity are the breach surface. Close that pattern once, then the rest of authz becomes reviewable.
        </Callout>
      </Stack>

      <Stack gap={8}>
        <H2>Architecture vs the docs</H2>
        <Table
          headers={["Claim", "Document", "Repo"]}
          rows={[
            ["Prisma in packages/database", "README", "Schema lives in apps/api/prisma"],
            ["Shared @renthub/types", "DEPLOYMENT.md", "packages/types is empty and unused"],
            ["Next.js 14", "README", "Next 16.1.3 / React 19"],
            ["Root prisma:generate / push", "README", "Scripts only on apps/api"],
            [".env.example", "README", "Not in the repo"],
            ["BullMQ jobs", "package.json dep", "Zero Queue/Worker imports"],
            ["Paystack escrow custody", "PITCH / USER_GUIDE", "Postgres status flags, not provider escrow"],
            ["Agent-free marketplace", "README title", "Full agent module + USER_GUIDE §4"],
          ]}
        />
      </Stack>

      <Stack gap={8}>
        <H2>Trust chain vs code</H2>
        <Text>
          Discovery and paid verification exist. The 48-hour offer lock is only `UNDER_OFFER` with no expiry job. Escrow is a ledger status; property becomes `RENTED` as soon as payment is marked successful. Handover OTP TTL is 24h in `transactionService`, while admin config says 48h and is unused. Dispute filing has no window. Featured listings set `featuredExpiresAt` but nothing clears them. Agent commission is recorded, not paid on the AfriExchange rail.
        </Text>
      </Stack>

      <TodoListCard
        defaultExpanded
        todos={[
          {
            id: "1",
            status: "pending",
            content:
              "Strip clerkId identity fallbacks. requireAuth on messages, uploads, verification, agents/me, tours mutations.",
          },
          {
            id: "2",
            status: "pending",
            content:
              "Lock POST /api/users (Clerk Svix webhook only) and strip role from PATCH /users/me.",
          },
          {
            id: "3",
            status: "pending",
            content: "requireAuth + requireRole(ADMIN) on /api/agents/admin/*.",
          },
          {
            id: "4",
            status: "pending",
            content:
              "Delete or admin-gate PATCH /transactions/:id/status and POST /:id/release. Never return OTP in JSON.",
          },
          {
            id: "5",
            status: "pending",
            content:
              "Paystack/AfriExchange: auth on verify, fail closed on HMAC mismatch, no mock-success on provider error.",
          },
          {
            id: "6",
            status: "pending",
            content:
              "Generate a real Prisma migration that matches schema.prisma. Stop relying on db push.",
          },
          {
            id: "7",
            status: "pending",
            content:
              "Hash OTP, rate-limit release, CORS allowlist, start:prod on dist, add CI + money-path tests.",
          },
        ]}
      />

      <Text size="small" tone="tertiary">
        Scope: `/Users/harz/Documents/backUps/izmir/renthub`. Runtime on Render/Neon may differ if the live database was mutated outside migration history.
      </Text>
    </Stack>
  );
}
