import {
  BarChart,
  Callout,
  Card,
  CardBody,
  CardHeader,
  Divider,
  Grid,
  H1,
  H2,
  Pill,
  Row,
  Stack,
  Stat,
  Table,
  Text,
  TodoListCard,
} from "cursor/canvas";

const SEVERITY_NOW = [
  { label: "High", value: 0 },
  { label: "Medium", value: 2 },
  { label: "Low", value: 1 },
];

const RECHECK = [
  ["Merchant refunds reverse gross", "Fixed", "Net debit + fee reverse + FOR UPDATE; fails if treasury short"],
  ["processMerchantPayment unlocked", "Fixed", "LOCK.UPDATE on customer and settlement wallets"],
  ["processTransfer leftover unlocked", "Fixed", "processUserTransfer locks both wallets"],
  ["Mint wallets/capacity unlocked", "Fixed", "Agent row + user/agent wallets FOR UPDATE"],
  ["Money helper only on P2P/swap", "Fixed", "Used across transfer/swap/fees/mint/refunds/escrows; parseFloat eliminated"],
  ["Admin JWT in localStorage / JS flash", "Fixed", "BFF server-to-server login sets httpOnly cookie directly; zero client JWT exposure"],
  ["Merchant / hosted-pay localStorage", "Fixed", "httpOnly merchant_token / customer_token; localStorage only cleaned"],
  ["Public payment-request GET", "Fixed", "authenticate required on user GET /payment-request/:id; amount/PII strictly gated"],
  ["Firebase Admin JSON on disk", "Fixed", "No *adminsdk* files under AfriExchange"],
  ["Access token revoke on logout", "Fixed", "blacklistToken + auth middleware check"],
  ["Refresh token on logout", "Fixed", "blacklistToken(refresh) from body or x-refresh-token"],
  ["AES-256-CBC keys", "Fixed", "New keys AES-256-GCM with legacy CBC decrypt"],
  ["Fee reverse silent skip", "Fixed", "ValidationError inside the same refund transaction"],
  ["README non-custodial", "Fixed", "Root README states custodial database ledger"],
  ["JWT middleware signature", "Fixed", "Fails closed if JWT_SECRET is unset; HMAC-SHA256 signature verified"],
  ["Financial race tests in CI", "Fixed", ".github/workflows/ci.yml runs migrations and race.test.js on PostgreSQL service"],
  ["Mobile request logging", "Fixed", "All apiClient request and auth failure logs strictly gated behind __DEV__"],
  ["Money.toNumber() before save", "Open", "Decimal math then IEEE Number into Sequelize (Money.add/sub/mul/div). Needs exact DECIMAL string persistence."],
  ["Cron still thin", "Partial", "Scheduler runs expireRequests, portfolioSnapshotJob, and autoDisputeJob; remaining worker/job orchestration needs audit."],
  ["Hosted payment GET returns amount", "Accepted", "Required for /pay checkout summary; customer PII and sensitive fields remain gated."],
];

const HIGH: [string, string, string?][] = [];

const MEDIUM = [
  [
    "Money.toNumber() before save",
    "Open",
    "Decimal math then IEEE Number returned into Sequelize (Money.add/sub/mul/div). Needs exact DECIMAL string persistence.",
  ],
  [
    "Cron still thin",
    "Partial",
    "Scheduler runs expireRequests, portfolioSnapshotJob, and autoDisputeJob; remaining worker/job orchestration needs audit.",
  ],
];

const LOW = [
  [
    "Hosted payment GET still returns amount",
    "Accepted",
    "Required for /pay checkout summary; customer PII and sensitive fields remain gated.",
  ],
];

const CLOSED_THIS_PASS = [
  "BFF credentials login in /api/auth/session eliminates client-side JWT flash",
  "Escrow lock and burn flows converted to Money precision math and decimal strings",
  "Web middleware fails closed on missing JWT_SECRET and enforces signature verification",
  "AfriExchange GitHub Actions CI workflow added with PostgreSQL and integration race tests",
  "Mobile apiClient logging strictly gated behind __DEV__",
  "Personal payment request endpoint protected with authenticate middleware",
];

export default function AfriXPlatformAudit() {
  return (
    <Stack gap={24} style={{ padding: 24, maxWidth: 960 }}>
      <Stack gap={8}>
        <Row gap={8} align="center">
          <H1 style={{ margin: 0 }}>AfriExchange re-audit</H1>
          <Pill tone="success">No open criticals</Pill>
        </Row>
        <Text tone="secondary" size="small">
          Fourth pass · 27 Oct 2026 · vs third pass 13 Oct 2026
        </Text>
      </Stack>

      <Callout tone="success" title="Closed since 13 Oct">
        Admin and merchant tokens are no longer readable from document.cookie or client JS.
        Refunds abort if the platform fee cannot be reversed. Logout blacklists
        the refresh token. Escrow lock and burn flows use Money precision math.
        Web middleware fails closed on missing secret and verifies JWT signatures.
      </Callout>

      <Callout tone="warning" title="Verdict">
        Money-path criticals and high-severity auth vulnerabilities are resolved.
        Escrow lock/burn now uses Money decimal strings, web middleware verifies JWT signatures
        and fails closed, CI runs race tests, and payment requests require authentication.
        Remaining items before general release: persist DECIMAL strings directly into Sequelize
        rather than IEEE toNumber(), and audit worker job scheduling.
      </Callout>

      <Grid columns={4} gap={12}>
        <Stat value="0" label="Critical open" tone="success" />
        <Stat value="0" label="High open" tone="success" />
        <Stat value="2" label="Medium remaining" tone="warning" />
        <Stat value="Pilot" label="Suggested readiness" />
      </Grid>

      <Divider />

      <Stack gap={8}>
        <H2>Still not fully closed by severity (count)</H2>
        <Text size="small" tone="secondary">
          High 0 · Medium 2 · Low 1 · Source: static re-review · 27 Oct 2026
        </Text>
        <BarChart
          categories={SEVERITY_NOW.map((s) => s.label)}
          series={[
            {
              name: "Open or partial findings",
              data: SEVERITY_NOW.map((s) => s.value),
              tone: "warning",
            },
          ]}
        />
      </Stack>

      <Stack gap={12}>
        <H2>Finding status</H2>
        <Table
          headers={["Finding", "Status", "Notes"]}
          rows={RECHECK}
          rowTone={RECHECK.map(([, status]) =>
            status === "Fixed"
              ? ("success" as const)
              : status === "Partial"
                ? ("info" as const)
                : ("warning" as const)
          )}
        />
      </Stack>

      <Stack gap={12}>
        <H2>High — remaining</H2>
        {HIGH.length === 0 ? (
          <Card>
            <CardBody>
              <Text tone="secondary">None — all 4 High findings closed.</Text>
            </CardBody>
          </Card>
        ) : (
          <Table headers={["Finding", "Status", "Why it matters"]} rows={HIGH} />
        )}
      </Stack>

      <Grid columns={2} gap={16}>
        <Stack gap={12}>
          <H2>Medium remaining</H2>
          {MEDIUM.length === 0 ? (
            <Card>
              <CardBody>
                <Text tone="secondary">None — all Medium findings closed.</Text>
              </CardBody>
            </Card>
          ) : (
            <Table headers={["Finding", "Status", "Notes"]} rows={MEDIUM} />
          )}
        </Stack>
        <Stack gap={12}>
          <H2>Low remaining</H2>
          {LOW.length === 0 ? (
            <Card>
              <CardBody>
                <Text tone="secondary">None — all Low findings closed.</Text>
              </CardBody>
            </Card>
          ) : (
            <Table headers={["Finding", "Status", "Notes"]} rows={LOW} />
          )}
        </Stack>
      </Grid>

      <Divider />

      <Stack gap={12}>
        <H2>Closed this pass</H2>
        <Card>
          <CardHeader>Auth, refunds, escrow, CI</CardHeader>
          <CardBody>
            <Stack gap={6}>
              {CLOSED_THIS_PASS.map((line) => (
                <Text key={line} size="small">
                  {line}
                </Text>
              ))}
            </Stack>
          </CardBody>
        </Card>
      </Stack>

      <Stack gap={12}>
        <H2>Recommended next steps</H2>
        <TodoListCard
          defaultExpanded
          todos={[
            {
              id: "1",
              status: "completed",
              content:
                "Escrow + Money: persist DECIMAL strings; remove parseFloat from lockForBurn / fee calc.",
            },
            {
              id: "2",
              status: "completed",
              content:
                "Fail closed in web middleware if JWT_SECRET is missing; enforce HMAC-SHA256 signature verification.",
            },
            {
              id: "3",
              status: "completed",
              content:
                "Run race.test.js in CI with TEST_DATABASE_URL and PostgreSQL service container.",
            },
            {
              id: "4",
              status: "completed",
              content:
                "Require authenticate on payment-request GET; strip mobile apiClient logs in production builds.",
            },
            {
              id: "5",
              status: "pending",
              content:
                "Money.toNumber(): persist exact DECIMAL strings into Sequelize rather than IEEE Numbers.",
            },
            {
              id: "6",
              status: "pending",
              content:
                "Cron audit: verify background worker scheduling and dead-file cleanup across deployment.",
            },
          ]}
        />
      </Stack>

      <Callout tone="info" title="Scope">
        Static re-audit of AfriExchange source after fourth-pass remediations.
        BFF server-to-server authentication now sets httpOnly cookies without browser JS token exposure.
        Integration race tests are configured in GitHub Actions CI with PostgreSQL service.
        Secret values were not opened.
      </Callout>
    </Stack>
  );
}
