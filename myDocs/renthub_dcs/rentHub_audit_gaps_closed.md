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
};

const FINDINGS: Finding[] = [
  {
    id: "N1",
    severity: "Critical",
    area: "Money",
    status: "Fixed",
    title: "Anchor credit with missing amount still funds escrow",
    evidence: "paidKoboMeetsExpected requires numeric kobo > 0 and ≥ expected before markEscrowedIfPayable",
    impact: "Missing or zero amount no longer marks ESCROWED",
  },
  {
    id: "N2",
    severity: "High",
    area: "Money",
    status: "Fixed",
    title: "AfriExchange webhook marks ESCROWED with no amount check",
    evidence: "afriExchangePaidMeetsExpected on webhook + verifyAndFinalizePayment",
    impact: "Underpay or amount-less collection.completed cannot fund a lease",
  },
  {
    id: "N3",
    severity: "High",
    area: "Money",
    status: "Fixed",
    title: "Paystack charge.success funds escrow without amount match",
    evidence: "Webhook and GET verify both require paidKoboMeetsExpected; amount missing fails closed",
    impact: "Paystack cannot mark escrow on a missing or short amount",
  },
  {
    id: "N4",
    severity: "High",
    area: "Money",
    status: "Fixed",
    title: "Variance pause is computed but never enforced",
    evidence: "requireEscrowOperational on POST /transactions and payment initialize routes; isEscrowOperational is false only on PAUSED_VARIANCE",
    impact: "Live mismatch pauses new bookings with 503. Unread rails are DEGRADED, not paused",
  },
  {
    id: "N5",
    severity: "High",
    area: "Money",
    status: "Fixed",
    title: "Public 0-kobo variance is tautological on AfriExchange",
    evidence: "getMerchantVaultBalanceKobo; no copy of DB expected; isReconciled only when HEALTHY live match",
    impact: "/transparency no longer claims 0 kobo without a vault read",
  },
  {
    id: "N6",
    severity: "High",
    area: "Money",
    status: "Fixed",
    title: "OTP release marks RELEASED then payouts fire-and-forget",
    evidence: "enqueueLandlordPayout plus retryFailedLandlordPayouts on the compliance tick (PENDING/FAILED, max 8)",
    impact: "Failed NIP/wallet payouts are retried instead of only logged",
  },
  {
    id: "N7",
    severity: "High",
    area: "Ops",
    status: "Fixed",
    title: "Webhook replay windows are missing or optional",
    evidence: "isWebhookTimestampFresh required on AfriExchange and Anchor; Anchor HMAC also rejects missing timestamp",
    impact: "Stale captured webhooks are 401",
  },
  {
    id: "N8",
    severity: "Medium",
    area: "PII",
    status: "Fixed",
    title: "Public property GET returns landlord email, phone, clerkId",
    evidence: "propertyService public landlord select is id, names, verified, avatar, ratings",
    impact: "Listing scrape no longer yields contact or Clerk IDs",
  },
  {
    id: "N9",
    severity: "Medium",
    area: "Product",
    status: "Fixed",
    title: "48h UNDER_OFFER unlock is tied to updatedAt",
    evidence: "Property.offerLockedAt; viewCount uses raw SQL so it does not refresh the lock",
    impact: "Offer window is 48h from lock, not last page view",
  },
  {
    id: "N10",
    severity: "Medium",
    area: "Auth",
    status: "Fixed",
    title: "Handover OTP is returned in JSON and logged on the client",
    evidence: "POST handover-otp omits otp; ApplicationsTab shows sent-to-channel; api.ts logs gated off production",
    impact: "Plaintext handover codes stay on SMS/email, not in JSON or prod consoles",
  },
  {
    id: "N11",
    severity: "Medium",
    area: "Auth",
    status: "Fixed",
    title: "Authenticated users can self-assign LANDLORD or AGENT after onboarding",
    evidence: "canSelfAssignRole: role change only while onboardingCompleted is false. ADMIN still blocked",
    impact: "Onboarding still picks a role once; later POSTs cannot flip it",
  },
  {
    id: "N12",
    severity: "Medium",
    area: "Auth",
    status: "Fixed",
    title: "Clerk JWT verification has no authorized parties",
    evidence: "verifyToken authorizedParties from CLERK_AUTHORIZED_PARTIES when set",
    impact: "Optional azp pin for production. Unset keeps current Clerk default so local login still works",
  },
  {
    id: "N13",
    severity: "Medium",
    area: "Ops",
    status: "Fixed",
    title: "CI does not build web or run money-path tests",
    evidence: "ci.yml web tsc job; moneyRail.test.ts for amount and timestamp helpers",
    impact: "Webhook amount logic and web types fail the build if they regress",
  },
  {
    id: "N14",
    severity: "Medium",
    area: "Ops",
    status: "Partial",
    title: "Compliance and reconciliation are setInterval on the API process",
    evidence: "pg_try_advisory_lock around recon, compliance, and payout retry. Still in-process, not an external cron",
    impact: "Multi-instance double-runs are blocked. A sleeping dyno can still skip the 6h tick",
  },
  {
    id: "N15",
    severity: "Medium",
    area: "Ops",
    status: "Fixed",
    title: "Unsigned Cloudinary uploads from the browser",
    evidence: "POST /upload/listing-drafts via authenticated API; listing wizards use uploadListingImages",
    impact: "Public unsigned preset is no longer used from the web app",
  },
  {
    id: "N16",
    severity: "Low",
    area: "Auth",
    status: "Fixed",
    title: "Next /admin middleware fail-opens when Clerk role claim is missing",
    evidence: "middleware + admin layout redirect unless role is ADMIN. Set Clerk publicMetadata.role=ADMIN for operators",
    impact: "Missing claim is deny. API remain requireRole(ADMIN) on DB role",
  },
  {
    id: "N17",
    severity: "Low",
    area: "Ops",
    status: "Partial",
    title: "Controllers leak error.message to clients",
    evidence: "Payment webhook/verify/initialize 500s no longer include error.message. Other controllers still do on some 500s",
    impact: "Money-path 500s are generic; leftover leaks are non-payment routes",
  },
  {
    id: "N18",
    severity: "Low",
    area: "Data",
    status: "Fixed",
    title: "Transaction.escrowHeld defaults to true in Prisma",
    evidence: "schema default false + migration 20261103210000_prod_test_hardening",
    impact: "Inserts that forget the flag look unfunded, not funded",
  },
];

const FILTERS = ["Open", "All", "Fixed", "Critical", "High", "Medium", "Low"] as const;
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
  const fixed = FINDINGS.filter((f) => f.status === "Fixed").length;
  const partial = FINDINGS.filter((f) => f.status === "Partial").length;
  const critical = open.filter((f) => f.severity === "Critical").length;
  const high = open.filter((f) => f.severity === "High").length;
  const medium = open.filter((f) => f.severity === "Medium").length;
  const low = open.filter((f) => f.severity === "Low").length;

  const visible = FINDINGS.filter((f) => {
    if (filter === "All") return true;
    if (filter === "Open") return f.status !== "Fixed";
    if (filter === "Fixed") return f.status === "Fixed";
    return f.severity === filter;
  });

  return (
    <Stack gap={24}>
      <Stack gap={8}>
        <Row gap={8} align="center">
          <H1 style={{ margin: 0 }}>RentHub audit</H1>
          <Pill tone="success">Ready for production testing</Pill>
        </Row>
        <Text tone="secondary">
          3 Nov 2026 close-out. Money rails fail closed on amount and replay.
          Transparency no longer copies DB expected as a vault balance.
        </Text>
      </Stack>

      <Callout tone="success" title="Launch blockers from this pass are closed">
        Underpayment cannot fund escrow on Anchor, AfriExchange, or Paystack.
        Variance pause is wired to payment initialize and transaction create.
        Handover OTP is not in JSON. Listing photos go through the API.
      </Callout>

      <Callout tone="warning" title="Before you test in production">
        Run prisma migrate deploy so offerLockedAt and escrowHeld default
        apply. Set Clerk publicMetadata.role=ADMIN on operator accounts or
        /admin will redirect. Set CLERK_AUTHORIZED_PARTIES to the live origin
        when you want azp pinning. Point AfriExchange at
        GET /integrations/renthub/escrow/balance or that rail stays DEGRADED
        (bookings still work; 0 kobo is not claimed).
      </Callout>

      <Row gap={24} wrap>
        <Stat value={String(fixed)} label="Closed this pass" tone="success" />
        <Stat value={String(partial)} label="Partial" tone="warning" />
        <Stat value={String(open.length)} label="Still open" />
        <Stat value={String(critical + high)} label="Open critical + high" tone="success" />
      </Row>

      <Grid columns={2} gap={24}>
        <Stack gap={8}>
          <H3>This pass by status (count)</H3>
          <PieChart
            donut
            size={220}
            data={[
              { label: "Fixed", value: fixed, tone: "success" },
              { label: "Partial", value: partial, tone: "warning" },
            ]}
          />
          <Text size="small" tone="tertiary">
            Source: renthub code · 3 Nov 2026 · 18 IDs from the discovery pass
          </Text>
        </Stack>
        <Stack gap={8}>
          <H3>Remaining by severity (count)</H3>
          <BarChart
            height={220}
            categories={["Critical", "High", "Medium", "Low"]}
            series={[
              {
                name: "Not fully closed",
                data: [critical, high, medium, low],
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
        <H2>Findings</H2>
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
          headers={["ID", "Sev", "Status", "Issue"]}
          rowTone={visible.map((f) => rowTone(f.status, f.severity))}
          rows={visible.map((f) => [
            f.id,
            <Pill key={`${f.id}-sev`} tone={pillForSeverity(f.severity)} size="sm">
              {f.severity}
            </Pill>,
            <Pill key={`${f.id}-st`} tone={f.status === "Fixed" ? "success" : "warning"} size="sm">
              {f.status}
            </Pill>,
            <Stack gap={2} key={`${f.id}-t`}>
              <Text weight="semibold">{f.title}</Text>
              <Text size="small" tone="secondary">
                {f.impact}
              </Text>
              <Text size="small" tone="tertiary">
                {f.evidence}
              </Text>
            </Stack>,
          ])}
        />
      </Stack>

      <Divider />

      <Stack gap={8}>
        <H2>Left for later</H2>
        <TodoListCard
          defaultExpanded
          todos={[
            {
              id: "n14",
              status: "in_progress",
              content:
                "N14 — Move recon/compliance off setInterval onto Render cron or BullMQ so a sleeping API does not skip ticks.",
            },
            {
              id: "n17",
              status: "pending",
              content: "N17 — Strip error.message from remaining non-payment 500 JSON bodies.",
            },
          ]}
        />
      </Stack>

      <CollapsibleSection title="Oct identity baseline (30 IDs) still closed" defaultOpen={false}>
        <Text size="small" tone="secondary">
          Clerk-only identity, no self-ADMIN, membership checks on messages
          and uploads, HMAC OTP with atomic 5-guess cap, webhook HMAC reject
          on bad signature. This pass did not reopen those.
        </Text>
      </CollapsibleSection>

      <Text size="small" tone="tertiary">
        Scope: /Users/harz/Documents/backUps/izmir/renthub. Runtime on
        Render/Neon still needs migrate deploy before the new columns exist.
      </Text>
    </Stack>
  );
}
