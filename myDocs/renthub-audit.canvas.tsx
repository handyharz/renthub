import {
  BarChart,
  Callout,
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
type Status = "Fixed" | "Partial" | "Open";

type Finding = {
  id: string;
  severity: Severity;
  area: Area;
  status: Status;
  title: string;
  evidence: string;
  impact: string;
};

const FINDINGS: Finding[] = [
  {
    id: "C1",
    severity: "Critical",
    area: "Auth",
    status: "Fixed",
    title: "Spoofable identity via clerkId",
    evidence: "getClerkId now uses req.auth / req.user only; messages/favorites/verification/tours use requireAuth",
    impact: "Query/body clerkId is no longer treated as identity",
  },
  {
    id: "C2",
    severity: "Critical",
    area: "Auth",
    status: "Fixed",
    title: "Public POST /api/users accepts role",
    evidence: "routes/users.ts requireAuth; sanitizeSelfServiceRole blocks ADMIN",
    impact: "Create/update requires a Clerk JWT; ADMIN cannot be self-assigned",
  },
  {
    id: "C3",
    severity: "Critical",
    area: "Auth",
    status: "Fixed",
    title: "PATCH /api/users/me can set role",
    evidence: "userController.updateCurrentUser destructures profile fields only",
    impact: "Role is no longer writable from the body",
  },
  {
    id: "C4",
    severity: "Critical",
    area: "Auth",
    status: "Fixed",
    title: "Agent admin APIs are open",
    evidence: "adminRouter.use(requireAuth, requireRole(\"ADMIN\"))",
    impact: "Approve/reject/suspend and KPIs require admin",
  },
  {
    id: "C5",
    severity: "Critical",
    area: "Money",
    status: "Fixed",
    title: "Legacy escrow release has no ownership check",
    evidence: "POST /transactions/:id/release is requireRole(ADMIN)",
    impact: "Tenants/landlords cannot force RELEASED on this path",
  },
  {
    id: "C6",
    severity: "Critical",
    area: "Money",
    status: "Fixed",
    title: "Client can PATCH transaction status",
    evidence: "PATCH /:id/status is requireRole(ADMIN)",
    impact: "ESCROWED / SUCCESSFUL cannot be set by a normal user",
  },
  {
    id: "C7",
    severity: "Critical",
    area: "Money",
    status: "Fixed",
    title: "Paystack verify marks paid on provider failure",
    evidence: "verify requires auth; 502 on provider error; amount match in kobo",
    impact: "Knowing a reference no longer funds escrow",
  },
  {
    id: "C8",
    severity: "Critical",
    area: "Money",
    status: "Fixed",
    title: "AfriExchange webhook continues on bad HMAC",
    evidence: "paymentController returns 401 on missing/invalid signature",
    impact: "Forged collection.completed events are rejected",
  },
  {
    id: "C9",
    severity: "Critical",
    area: "IDOR",
    status: "Fixed",
    title: "Conversation messages readable with no membership check",
    evidence: "messageController calls isParticipant before read/send",
    impact: "Inbox dump by conversation id is closed",
  },
  {
    id: "C10",
    severity: "Critical",
    area: "Money",
    status: "Fixed",
    title: "GET transaction returns releaseOtp",
    evidence: "sanitizeTransaction / stripReleaseOtp; OTP stored hashed",
    impact: "Plaintext OTP is not returned in JSON",
  },
  {
    id: "H1",
    severity: "High",
    area: "IDOR",
    status: "Fixed",
    title: "Uploads have no auth or ownership",
    evidence: "upload routes requireAuth + landlord/admin check",
    impact: "Cannot overwrite another landlord’s images",
  },
  {
    id: "H2",
    severity: "High",
    area: "Money",
    status: "Fixed",
    title: "Direct AfriExchange wallet link skips OTP",
    evidence: "PUT /payouts/link-afriexchange is ADMIN; landlords use OTP link-verification",
    impact: "Settlement destination cannot be hijacked without OTP",
  },
  {
    id: "H3",
    severity: "High",
    area: "IDOR",
    status: "Fixed",
    title: "Tour create uses body clerkId; status has no authz",
    evidence: "tenantId from req.user; updateStatus checks landlord/tenant/admin",
    impact: "Cannot book or accept tours as another user",
  },
  {
    id: "H4",
    severity: "High",
    area: "IDOR",
    status: "Fixed",
    title: "sendMessage does not check conversation membership",
    evidence: "isParticipant before send",
    impact: "Cannot inject messages into other threads",
  },
  {
    id: "H5",
    severity: "High",
    area: "Money",
    status: "Fixed",
    title: "AfriExchange verify is public; sim mode marks escrow",
    evidence: "verify route requires auth; simulation disabled in production",
    impact: "Missing keys fail closed in prod",
  },
  {
    id: "H6",
    severity: "High",
    area: "Auth",
    status: "Fixed",
    title: "/admin gated server-side and in middleware",
    evidence: "middleware.ts redirects non-admins; AdminLayout checks session claims server-side; /api/admin enforces ADMIN",
    impact: "Admin route shell and backend APIs are both strictly gated against non-admins",
  },
  {
    id: "H7",
    severity: "High",
    area: "Data",
    status: "Fixed",
    title: "Prisma schema is ahead of committed migrations",
    evidence: "migrations/20261025000000_phase4_audit_sync",
    impact: "Fresh deploy can migrate to the Phase 4 models",
  },
  {
    id: "M1",
    severity: "Medium",
    area: "Auth",
    status: "Fixed",
    title: "Property ownership skipped when req.user is missing",
    evidence: "requireDbUser + landlordId === req.user.id",
    impact: "Update/delete listings requires a synced DB user",
  },
  {
    id: "M2",
    severity: "Medium",
    area: "Auth",
    status: "Fixed",
    title: "Reviews take reviewerId from the body",
    evidence: "reviewController uses req.user.id",
    impact: "Cannot spoof verified reviews for another account",
  },
  {
    id: "M3",
    severity: "Medium",
    area: "Money",
    status: "Fixed",
    title: "Handover OTP is 6 digits, plaintext, not timing-safe",
    evidence: "hashOtp + otpMatches timing-safe; DB-persisted atomic attempt cap (max 5); never returned in JSON",
    impact: "DB leak of the hash is not enough to redeem; brute force is rate-limited and locked in PostgreSQL",
  },
  {
    id: "M4",
    severity: "Medium",
    area: "Ops",
    status: "Fixed",
    title: "CORS origin: true with credentials",
    evidence: "CORS_ORIGIN / FRONTEND_URL allowlist in apps/api/src/index.ts",
    impact: "Arbitrary browser origins cannot call the API with cookies",
  },
  {
    id: "M5",
    severity: "Medium",
    area: "Money",
    status: "Fixed",
    title: "GET /:id registered before /tenant/all",
    evidence: "routes/transactions.ts registers /tenant/all and /landlord/all first",
    impact: "/transactions/tenant/all is no longer treated as an id",
  },
  {
    id: "M6",
    severity: "Medium",
    area: "Data",
    status: "Fixed",
    title: "Naira vs kobo mixed across tables",
    evidence: "ServiceTransaction.amount standardized to Naira in serviceTransaction.service.ts",
    impact: "All monetary amounts (rent, services, property) are uniform Naira integers",
  },
  {
    id: "M7",
    severity: "Medium",
    area: "Product",
    status: "Fixed",
    title: "48h listing lock and dispute window are not jobs",
    evidence: "complianceJobs: featured expiry, UNDER_OFFER unlock, expired OTP flag",
    impact: "Offer lock and OTP window now have a scheduled sweeper",
  },
  {
    id: "M8",
    severity: "Medium",
    area: "Product",
    status: "Fixed",
    title: "Renewal payment path is unused",
    evidence: "POST /renewals/:id/pay and POST /renewals/verify transition status to PAID_IN_ESCROW",
    impact: "Accepted lease renewals can pay into escrow via API and UI",
  },
  {
    id: "M9",
    severity: "Medium",
    area: "Ops",
    status: "Fixed",
    title: "start:prod runs tsx after migrate deploy",
    evidence: "apps/api package.json start:prod = prisma migrate deploy && node dist/index.js; .github/workflows/ci.yml",
    impact: "Prod runs compiled JS; API tests and tsc run in CI",
  },
  {
    id: "M10",
    severity: "Medium",
    area: "Product",
    status: "Fixed",
    title: "Property marked RENTED on payment, before OTP",
    evidence: "Payment success keeps UNDER_OFFER; RENTED set after OTP release",
    impact: "Trust-chain stage 5 no longer completes stage 7 early",
  },
  {
    id: "L1",
    severity: "Low",
    area: "Ops",
    status: "Fixed",
    title: "No API rate limiting or Zod/Joi",
    evidence: "express-rate-limit with trust proxy on global /api, strict limit on verification & payment init, /api/webhooks/* strictly exempt",
    impact: "Global DoS, SMS pumping, and brute force protection enforced at API layer",
  },
  {
    id: "L2",
    severity: "Low",
    area: "Ops",
    status: "Fixed",
    title: "Docs disagree with the repo",
    evidence: "README updated to reflect Next.js 16, React 19, apps/api/prisma structure, and current scripts",
    impact: "Documentation is accurate with codebase",
  },
  {
    id: "L3",
    severity: "Low",
    area: "Data",
    status: "Fixed",
    title: "Notification.userId has no User FK",
    evidence: "Notification.userId foreign key to User; LandlordPayout.transactionId foreign key to Transaction in schema.prisma",
    impact: "Relational integrity preserved; zero orphan notifications or payouts",
  },
];

const FILTERS = ["All", "Open", "Fixed", "Critical", "High", "Medium", "Low"] as const;
type Filter = (typeof FILTERS)[number];

function statusTone(status: Status): "success" | "warning" | "info" {
  if (status === "Fixed") return "success";
  if (status === "Partial") return "warning";
  return "info";
}

function pillTone(status: Status): "success" | "warning" | "info" {
  return statusTone(status);
}

export default function RenthubAudit() {
  const [filter, setFilter] = useCanvasState<Filter>("filter", "All");

  const visible = FINDINGS.filter((f) => {
    if (filter === "All") return true;
    if (filter === "Open") return f.status === "Open" || f.status === "Partial";
    if (filter === "Fixed") return f.status === "Fixed";
    return f.severity === filter;
  });

  const closed = FINDINGS.filter((f) => f.status === "Fixed").length;
  const partial = FINDINGS.filter((f) => f.status === "Partial").length;
  const open = FINDINGS.filter((f) => f.status === "Open").length;

  return (
    <Stack gap={24}>
      <Stack gap={8}>
        <Row gap={8} align="center">
          <H1 style={{ margin: 0 }}>RentHub audit — status</H1>
          <Pill tone="success">All 30 findings addressed</Pill>
        </Row>
        <Text tone="secondary">
          Re-check 27 Oct 2026 against the 25 Oct discovery canvas. Original
          review was static source of `apps/api` and `apps/web`. This pass
          scores the same 30 IDs against current code.
        </Text>
      </Stack>

      <Callout tone="success" title="All 30 discovery findings addressed in code; Service-layer smoke test verified on Neon">
        Identity is JWT-only. Escrow cannot be marked paid without provider
        success. Role cannot be set to ADMIN from the client. Unit consistency
        standardized to Naira. Lease renewal escrow payments wired. API rate limiting
        and database-persisted OTP attempt counters enforced. Service-layer smoke test passed with 0 errors on Neon DB.
        HTTP endpoints, signed live webhooks, and real payout disbursements remain to be orchestrated in a full staging environment.
      </Callout>

      <Row gap={24} wrap>
        <Stat value={String(closed)} label="Closed of 30" tone="success" />
        <Stat value={String(partial)} label="Partial" tone="warning" />
        <Stat value={String(open)} label="Still open" tone="info" />
        <Stat value="Service-layer passed" label="Neon DB Smoke Test" tone="success" />
      </Row>

      <Grid columns={2} gap={24}>
        <Stack gap={8}>
          <H3>Findings by current status (count)</H3>
          <PieChart
            donut
            size={220}
            data={[
              { label: "Fixed", value: closed, tone: "success" },
              { label: "Partial", value: partial, tone: "warning" },
              { label: "Open", value: open, tone: "info" },
            ].filter((d) => d.value > 0)}
          />
          <Text size="small" tone="tertiary">
            Source: code re-check of renthub · 27 Oct 2026 · 30 original IDs
          </Text>
        </Stack>
        <Stack gap={8}>
          <H3>Open + partial by original severity (count)</H3>
          <BarChart
            height={220}
            categories={["Critical", "High", "Medium", "Low"]}
            series={[
              {
                name: "Still not fully closed",
                data: [
                  FINDINGS.filter((f) => f.severity === "Critical" && f.status !== "Fixed").length,
                  FINDINGS.filter((f) => f.severity === "High" && f.status !== "Fixed").length,
                  FINDINGS.filter((f) => f.severity === "Medium" && f.status !== "Fixed").length,
                  FINDINGS.filter((f) => f.severity === "Low" && f.status !== "Fixed").length,
                ],
                tone: "warning",
              },
            ]}
          />
          <Text size="small" tone="tertiary">
            Source: same 30 IDs · value axis is finding count
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
          Showing {visible.length} of {FINDINGS.length} · default filter is All
        </Text>
        <Table
          striped
          stickyHeader
          headers={["ID", "Sev", "Status", "Issue", "Now"]}
          columnAlign={["left", "left", "left", "left", "left"]}
          rowTone={visible.map((f) => statusTone(f.status))}
          rows={visible.map((f) => [
            f.id,
            f.severity,
            <Pill key={`${f.id}-st`} tone={pillTone(f.status)} size="sm">
              {f.status}
            </Pill>,
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
        <H2>Remediation Log</H2>
        <TodoListCard
          defaultExpanded
          todos={[
            {
              id: "h6",
              status: "completed",
              content:
                "H6 — Gated /admin in middleware and AdminLayout server-side; /api/admin requires ADMIN.",
            },
            {
              id: "m6",
              status: "completed",
              content: "M6 — Standardized ServiceTransaction.amount to Naira; migration added to convert legacy rows.",
            },
            {
              id: "m8",
              status: "completed",
              content: "M8 — Renewal payment and gateway verification wired; transitions to PAID_IN_ESCROW.",
            },
            {
              id: "l1",
              status: "completed",
              content: "L1 — express-rate-limit configured with trust proxy; DB-persisted OTP attempt limit (max 5).",
            },
            {
              id: "l2",
              status: "completed",
              content: "L2 — README updated to Next 16 / React 19, apps/api/prisma, and current scripts.",
            },
            {
              id: "l3",
              status: "completed",
              content: "L3 — Foreign key constraints committed in SQL migration with orphan cleanup.",
            },
            {
              id: "smoke-test",
              status: "completed",
              content:
                "Service-layer lifecycle (escrow → OTP → release → payout row) passed on Neon staging.",
            },
          ]}
        />
      </Stack>

      <Text size="small" tone="tertiary">
        Scope: `/Users/harz/Documents/backUps/izmir/renthub`. The 25 Oct canvas
        was the discovery snapshot; this file is the status re-check. Runtime on
        Render/Neon may differ if the live database was mutated outside
        migration history.
      </Text>
    </Stack>
  );
}
