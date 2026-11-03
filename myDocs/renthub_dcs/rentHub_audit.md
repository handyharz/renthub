import {
  BarChart,
  Callout,
  CollapsibleSection,
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
type Area = "Money" | "Auth" | "IDOR" | "PII" | "Ops" | "Product" | "Data";
type Status = "Open" | "Partial" | "Fixed";

type Finding = {
  id: string;
  severity: Severity;
  area: Area;
  status: Status;
  title: string;
  evidence: string;
  impact: string;
  fix: string;
};

const FINDINGS: Finding[] = [
  {
    id: "N1",
    severity: "Critical",
    area: "Money",
    status: "Open",
    title: "Anchor credit with missing amount still funds escrow",
    evidence:
      "paymentController.handleAnchorWebhook: if (amountKobo && amountKobo < expectedKobo) — 0/undefined skips the check; then updateMany PENDING → ESCROWED",
    impact:
      "A signed inbound event without amount (or amount 0) marks the lease fully escrowed. Dedicated NUBANs accept arbitrary transfers; this is the underpayment path.",
    fix: "Require a numeric amount ≥ expected kobo. Otherwise leave PENDING and record an underpayment event.",
  },
  {
    id: "N2",
    severity: "High",
    area: "Money",
    status: "Open",
    title: "AfriExchange webhook marks ESCROWED with no amount check",
    evidence:
      "handleAfriExchangeWebhook on collection.completed updates status ESCROWED / escrowHeld true with no paid-vs-totalAmount compare",
    impact:
      "Any completed collection event that HMAC-matches can fund a lease regardless of kobo received.",
    fix: "Compare provider amount to transaction.totalAmount in kobo before the status write. Use updateMany where status is PENDING.",
  },
  {
    id: "N3",
    severity: "High",
    area: "Money",
    status: "Open",
    title: "Paystack charge.success funds escrow without amount match",
    evidence:
      "handleSuccessfulCharge calls updateTransactionStatus(SUCCESSFUL) after signature only; verifyPayment skips the kobo check when amount is not a number",
    impact:
      "Paystack initialize sets amount, but webhook/verify still need a hard match. Missing amount currently fail-opens.",
    fix: "Reject unless paymentData.amount is a number and ≥ expected kobo. Do the same in the webhook handler.",
  },
  {
    id: "N4",
    severity: "High",
    area: "Money",
    status: "Open",
    title: "Variance pause is computed but never enforced",
    evidence:
      "isEscrowOperational() exists in reconcileAnchorEscrow.ts and has zero callers. Payment initialize / transaction create never check it",
    impact:
      "The audit pack claim “variance ≠ 0 kobo pauses new bookings” is not implemented. Bookings continue while the flag is PAUSED_VARIANCE.",
    fix: "Gate POST /payments/*, POST /transactions, and Anchor initialize on isEscrowOperational(). Return 503 when paused.",
  },
  {
    id: "N5",
    severity: "High",
    area: "Money",
    status: "Open",
    title: "Public 0-kobo variance is tautological on AfriExchange",
    evidence:
      "reconcileAnchorEscrow.ts sets afriExchangeLedgerTotalKobo = afriDbExpectedKobo. isReconciled is also true whenever NODE_ENV !== production",
    impact:
      "/transparency can show Variance: 0 for the AfriExchange rail with no live vault read. That is not an independent proof.",
    fix: "Fetch the merchant vault balance. Never set isReconciled true just because the environment is not production.",
  },
  {
    id: "N6",
    severity: "High",
    area: "Money",
    status: "Open",
    title: "OTP release marks RELEASED then payouts fire-and-forget",
    evidence:
      "transactionService.releaseEscrowWithOTP updateMany RELEASED, then anchorService.disburseLandlordPayout(...).catch / AfriExchange equivalent",
    impact:
      "DB and property say paid-out while NIP/wallet disbursement can fail silently. Reconciliation will not save you: status is no longer ESCROWED.",
    fix: "Keep a PAYOUT_PENDING state. Retry from a job. Only set RELEASED after provider success, or keep escrowHeld until payout settles.",
  },
  {
    id: "N7",
    severity: "High",
    area: "Ops",
    status: "Open",
    title: "Webhook replay windows are missing or optional",
    evidence:
      "AfriExchange HMAC includes timestamp but never rejects stale timestamps. Anchor HMAC is body-only; replay protection runs only if x-anchor-timestamp is present",
    impact:
      "A captured valid webhook can be replayed. Status guards help some rails (PENDING→ESCROWED) and not others (AfriExchange checks status !== ESCROWED only).",
    fix: "Reject timestamps older than ~5 minutes on both rails. Bind timestamp into the Anchor HMAC. Make status transitions strictly PENDING → ESCROWED.",
  },
  {
    id: "N8",
    severity: "Medium",
    area: "PII",
    status: "Open",
    title: "Public property GET returns landlord email, phone, clerkId",
    evidence:
      "propertyService.getPropertyById select landlord.email, phone, clerkId — GET /properties/:id is optionalAuth",
    impact:
      "Anyone can scrape landlord contacts and Clerk IDs from listings. Conflicts with the “zero PII on transparency” story for the rest of the product.",
    fix: "Return firstName, avatar, verified, rating only on public GET. Keep phone/email for authenticated parties to that listing.",
  },
  {
    id: "N9",
    severity: "Medium",
    area: "Product",
    status: "Open",
    title: "48h UNDER_OFFER unlock is tied to updatedAt",
    evidence:
      "complianceJobs expiredOffers uses status UNDER_OFFER AND updatedAt < now-48h. getPropertyById increments viewCount, which updates updatedAt",
    impact:
      "A listing under offer that keeps getting views never unlocks. Quiet listings unlock 48h after last view, not 48h after the offer.",
    fix: "Store offerLockedAt (or use application.approvedAt) and sweep on that column only.",
  },
  {
    id: "N10",
    severity: "Medium",
    area: "Auth",
    status: "Open",
    title: "Handover OTP is returned in JSON and logged on the client",
    evidence:
      "requestHandoverOtp returns data.otp. apps/web/src/lib/api.ts console.logs every request body and URL",
    impact:
      "The hash-at-rest work is real, but the live code is in browser consoles, extensions, and support screenshots.",
    fix: "Stop returning otp in the API body (SMS/email only). Gate api.ts logs behind NODE_ENV === development.",
  },
  {
    id: "N11",
    severity: "Medium",
    area: "Auth",
    status: "Open",
    title: "Authenticated users can self-assign LANDLORD or AGENT",
    evidence:
      "POST /api/users uses sanitizeSelfServiceRole — ADMIN blocked, LANDLORD/AGENT allowed on create and on existing-user update",
    impact:
      "Role is a trust boundary (listings, payouts, applications). It should be an onboarding state machine, not a JSON field.",
    fix: "Allow TENANT only on create. Promote LANDLORD/AGENT through dedicated verified onboarding endpoints.",
  },
  {
    id: "N12",
    severity: "Medium",
    area: "Auth",
    status: "Open",
    title: "Clerk JWT verification has no authorized parties",
    evidence:
      "middleware/auth.ts verifyToken({ secretKey }) — no authorizedParties / clockSkew config",
    impact:
      "Tokens issued for another Clerk application in the same instance may be accepted depending on instance setup.",
    fix: "Pass authorizedParties: [FRONTEND_URL / Clerk frontend API] as Clerk documents for Express.",
  },
  {
    id: "N13",
    severity: "Medium",
    area: "Ops",
    status: "Open",
    title: "CI does not build web or run money-path tests",
    evidence:
      ".github/workflows/ci.yml: prisma generate + utils unit tests + tsc in apps/api only. Four *.test.ts files, none covering webhooks/OTP/payouts. e2e_smoke_test.ts is manual",
    impact:
      "The escrow rails can regress without a red build. The smoke script is the real money test and is not in CI.",
    fix: "Add web lint/build. Run a subset of e2e_smoke_test against a CI Postgres, or extract webhook/OTP unit tests with fixtures.",
  },
  {
    id: "N14",
    severity: "Medium",
    area: "Ops",
    status: "Open",
    title: "Compliance and reconciliation are setInterval on the API process",
    evidence:
      "startComplianceJobs / startAnchorEscrowReconciliationJob use setInterval; no BullMQ job despite bullmq in package.json",
    impact:
      "Multiple dynos double-run. A sleeping Render instance skips the 6-hour “institutional” recon. Snapshots will have gaps.",
    fix: "Use a real scheduler (Render cron, BullMQ + Redis, or pg_cron) with a lock row.",
  },
  {
    id: "N15",
    severity: "Medium",
    area: "Ops",
    status: "Open",
    title: "Unsigned Cloudinary uploads from the browser",
    evidence:
      "properties/new/page.tsx uses NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME + UPLOAD_PRESET",
    impact:
      "Anyone with the public preset can fill the media account. API upload routes are auth’d; this path is not.",
    fix: "Signed uploads via the API only. Restrict the preset or delete it.",
  },
  {
    id: "N16",
    severity: "Low",
    area: "Auth",
    status: "Partial",
    title: "Next /admin middleware fail-opens when Clerk role claim is missing",
    evidence:
      "middleware.ts and admin/layout.tsx: if (role && role !== ADMIN) redirect — missing role continues. AdminGuard + /api/admin requireRole(ADMIN) still block data",
    impact:
      "Non-admins can load the admin chrome until the client guard runs. APIs stay closed.",
    fix: "Fail closed: redirect unless sessionClaims role is ADMIN. Prefer DB role via a server check, not only Clerk metadata.",
  },
  {
    id: "N17",
    severity: "Low",
    area: "Ops",
    status: "Open",
    title: "Controllers leak error.message to clients",
    evidence:
      "Dozens of 500 JSON bodies include error: error.message across payment, transaction, admin, upload, property controllers",
    impact:
      "Provider/Prisma internals can surface to the browser.",
    fix: "Return a stable message; log the exception server-side.",
  },
  {
    id: "N18",
    severity: "Low",
    area: "Data",
    status: "Open",
    title: "Transaction.escrowHeld defaults to true in Prisma",
    evidence:
      "schema.prisma Transaction.escrowHeld Boolean @default(true). createTransaction overrides to false",
    impact:
      "Any insert that forgets the override looks funded. Dangerous default for a money flag.",
    fix: "Change the default to false and add a migration.",
  },
];

const PRIOR_CLOSED = 30;

const FILTERS = ["Open", "All", "Critical", "High", "Medium", "Low"] as const;
type Filter = (typeof FILTERS)[number];

function rowTone(status: Status, severity: Severity) {
  if (status === "Fixed") return "success" as const;
  if (severity === "Critical") return "danger" as const;
  if (severity === "High") return "warning" as const;
  if (status === "Partial") return "info" as const;
  return "neutral" as const;
}

function pillForSeverity(severity: Severity) {
  if (severity === "Critical") return "deleted" as const;
  if (severity === "High") return "warning" as const;
  if (severity === "Medium") return "info" as const;
  return "neutral" as const;
}

export default function RenthubAudit() {
  const [filter, setFilter] = useCanvasState<Filter>("filter", "Open");

  const open = FINDINGS.filter((f) => f.status !== "Fixed");
  const critical = open.filter((f) => f.severity === "Critical").length;
  const high = open.filter((f) => f.severity === "High").length;
  const medium = open.filter((f) => f.severity === "Medium").length;
  const low = open.filter((f) => f.severity === "Low").length;

  const visible = FINDINGS.filter((f) => {
    if (filter === "All") return true;
    if (filter === "Open") return f.status !== "Fixed";
    return f.severity === filter;
  });

  const byArea = ["Money", "Auth", "PII", "Ops", "Product", "IDOR"].map((area) =>
    open.filter((f) => f.area === area).length
  );

  return (
    <Stack gap={24}>
      <Stack gap={8}>
        <Row gap={8} align="center">
          <H1 style={{ margin: 0 }}>RentHub audit</H1>
          <Pill tone="warning">Pilot, not audit-grade</Pill>
        </Row>
        <Text tone="secondary">
          Fresh pass 3 Nov 2026 on apps/api and apps/web. Identity and
          impersonation issues from 25–27 Oct are treated as closed. This
          pass is about money rails, public claims, and leftover PII.
        </Text>
      </Stack>

      <Callout tone="danger" title="Do not treat /transparency as independent proof">
        AfriExchange pool balance is copied from the database expected
        total, so that rail always contributes 0 kobo variance. New
        bookings are not paused when variance is non-zero. Anchor
        credits with a missing amount still mark escrow funded.
      </Callout>

      <Callout tone="success" title="Identity launch blockers from the prior canvas stay closed">
        Clerk JWT is the only identity. ADMIN cannot be self-assigned.
        Messages, tours, uploads, and transaction reads check membership.
        Handover OTP is HMAC-stored with an atomic 5-guess cap. Paystack
        and AfriExchange webhooks reject bad HMAC.
      </Callout>

      <Row gap={24} wrap>
        <Stat value={String(critical)} label="Open critical" tone="danger" />
        <Stat value={String(high)} label="Open high" tone="warning" />
        <Stat value={String(medium + low)} label="Open medium + low" />
        <Stat value={String(PRIOR_CLOSED)} label="Prior IDs closed" tone="success" />
      </Row>

      <Grid columns={2} gap={24}>
        <Stack gap={8}>
          <H3>Open findings by severity (count)</H3>
          <PieChart
            donut
            size={220}
            data={[
              { label: "Critical", value: critical, tone: "danger" },
              { label: "High", value: high, tone: "warning" },
              { label: "Medium", value: medium, tone: "info" },
              { label: "Low", value: low, tone: "neutral" },
            ]}
          />
          <Text size="small" tone="tertiary">
            Source: static review of renthub · 3 Nov 2026 · 18 new IDs
          </Text>
        </Stack>
        <Stack gap={8}>
          <H3>Open findings by area (count)</H3>
          <BarChart
            height={220}
            categories={["Money", "Auth", "PII", "Ops", "Product", "IDOR"]}
            series={[
              {
                name: "Open findings",
                data: byArea,
                tone: "warning",
              },
            ]}
          />
          <Text size="small" tone="tertiary">
            Source: same 18 IDs · value axis is finding count
          </Text>
        </Stack>
      </Grid>

      <Divider />

      <Stack gap={10}>
        <H2>Open findings</H2>
        <Row gap={8} wrap>
          {FILTERS.map((f) => (
            <Pill key={f} active={filter === f} onClick={() => setFilter(f)}>
              {f}
            </Pill>
          ))}
        </Row>
        <Text size="small" tone="tertiary">
          Showing {visible.length} of {FINDINGS.length} · default filter is Open
        </Text>
        <Table
          striped
          stickyHeader
          headers={["ID", "Sev", "Area", "Issue", "Fix"]}
          rowTone={visible.map((f) => rowTone(f.status, f.severity))}
          rows={visible.map((f) => [
            f.id,
            <Pill key={`${f.id}-sev`} tone={pillForSeverity(f.severity)} size="sm">
              {f.severity}
            </Pill>,
            f.area,
            <Stack gap={2} key={`${f.id}-t`}>
              <Text weight="semibold">{f.title}</Text>
              <Text size="small" tone="secondary">
                {f.impact}
              </Text>
              <Text size="small" tone="tertiary">
                {f.evidence}
              </Text>
            </Stack>,
            <Text size="small" key={`${f.id}-f`}>
              {f.fix}
            </Text>,
          ])}
        />
      </Stack>

      <Divider />

      <Stack gap={8}>
        <H2>What to do next</H2>
        <TodoListCard
          defaultExpanded
          todos={[
            {
              id: "n1",
              status: "pending",
              content:
                "N1–N3 — Fail closed on amount: require numeric kobo ≥ expected on Anchor, AfriExchange, and Paystack before ESCROWED.",
            },
            {
              id: "n4",
              status: "pending",
              content:
                "N4–N5 — Fetch AfriExchange vault; pause initialize/create when isEscrowOperational() is false; stop marking non-prod as reconciled.",
            },
            {
              id: "n6",
              status: "pending",
              content:
                "N6 — Payout after OTP must be a durable job with PAYOUT_PENDING, not .catch(console.error).",
            },
            {
              id: "n7",
              status: "pending",
              content:
                "N7 — 5-minute webhook timestamp windows; HMAC the timestamp on Anchor.",
            },
            {
              id: "n8",
              status: "pending",
              content:
                "N8 / N10 — Strip landlord PII from public property GET; stop returning OTP in JSON; stop logging API bodies in production.",
            },
          ]}
        />
      </Stack>

      <CollapsibleSection title="Closed baseline (30 IDs from 25–27 Oct)" defaultOpen={false}>
        <Text size="small" tone="secondary">
          Spoofable clerkId, public role=ADMIN, client-set transaction status,
          unverified Paystack success-on-error, AfriExchange HMAC continue-on-fail,
          message IDOR, plaintext OTP in GET transaction, open uploads, wallet
          link without OTP, CORS *, mixed naira/kobo on services, missing
          Notification FK, and in-memory-only OTP counters were re-checked as
          fixed. Do not reopen those unless a regression appears.
        </Text>
      </CollapsibleSection>

      <Text size="small" tone="tertiary">
        Scope: /Users/harz/Documents/backUps/izmir/renthub. Static source
        review of apps/api and apps/web. Runtime on Render/Neon was not
        exercised in this pass.
      </Text>
    </Stack>
  );
}
