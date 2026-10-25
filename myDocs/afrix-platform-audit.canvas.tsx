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
  H3,
  Pill,
  Row,
  Stack,
  Stat,
  Table,
  Text,
} from "cursor/canvas";

const SEVERITY_NOW = [
  { label: "High", value: 4 },
  { label: "Medium", value: 6 },
  { label: "Low", value: 3 },
];

const RECHECK = [
  ["Merchant refunds reverse gross", "Fixed", "Net debit + platform fee reverse + FOR UPDATE"],
  ["processMerchantPayment unlocked", "Fixed", "LOCK.UPDATE on customer and settlement wallets"],
  ["processTransfer leftover unlocked", "Fixed", "processUserTransfer locks both wallets"],
  ["Mint wallets/capacity unlocked", "Fixed", "Agent row + user/agent wallets FOR UPDATE"],
  ["Money helper only on P2P/swap", "Partial", "Used in transfer/swap/fees/mint/refunds; escrow still parseFloat"],
  ["Admin JWT in localStorage", "Partial", "Moved to cookie; still JS-readable (not httpOnly)"],
  ["Public payment-request GET", "Partial", "Amount/PII gated; id/reference/token_type still public"],
  ["Firebase Admin JSON on disk", "Fixed", "No *adminsdk* files under AfriExchange"],
  ["Access token revoke on logout", "Fixed", "blacklistToken + auth middleware check"],
  ["AES-256-CBC keys", "Fixed", "New keys AES-256-GCM with legacy CBC decrypt"],
  ["Financial race tests", "Partial", "tests/integration/race.test.js exists; skipped without TEST_DATABASE_URL"],
];

const HIGH = [
  [
    "Admin JWT still stealable via XSS",
    "Cookie is set from JS (js-cookie). SameSite=strict helps CSRF, not XSS. httpOnly cookies or a BFF are still required.",
  ],
  [
    "Merchant and hosted-pay tokens in localStorage",
    "merchant login/register and customer-api still persist JWTs in localStorage",
  ],
  [
    "Escrow burn still uses JS Number",
    "lockForBurn / finalizeBurn / refund mutate pending_balance with parseFloat, not Money",
  ],
  [
    "Fee reverse can silently skip",
    "If platform wallet balance < fee, refund still completes and treasury is not debited",
  ],
];

const MEDIUM = [
  ["Middleware does not verify JWT signature", "Checks three segments + exp only; APIs still verify"],
  ["Refresh token not blacklisted", "Logout revokes access token only"],
  ["Money.toNumber() before save", "Decimal math then IEEE Number into Sequelize"],
  ["Cron still thin", "Only expireRequests + portfolioSnapshotJob; other jobs unwired"],
  ["README still says non-custodial", "Ledger remains API-custodied Postgres wallets"],
  ["Race tests skip by default", "No TEST_DATABASE_URL → describe.skip; CI may not run them"],
];

const LOW = [
  ["Public payment-request stub", "Anonymous GET still confirms a request exists (id/reference/token_type)"],
  ["Hosted payment GET still returns amount", "Needed for /pay checkout; customer PII remains gated"],
  ["Mobile API client still logs every request", "Noise and token-presence leakage in device logs"],
];

const FIX_ORDER = [
  ["1", "Set admin/merchant tokens httpOnly Secure SameSite via a server Set-Cookie (stop js-cookie)"],
  ["2", "Fail refund if platform fee cannot be reversed, inside the same transaction"],
  ["3", "Switch escrowService to Money; persist DECIMAL strings"],
  ["4", "Blacklist refresh tokens on logout; verify JWT signature in web middleware or drop shell trust"],
  ["5", "Wire remaining cron jobs or delete dead files; run race tests in CI with TEST_DATABASE_URL"],
  ["6", "Correct README custody language"],
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
          Third pass · Oct 13, 2026 · vs prior re-audit same day
        </Text>
      </Stack>

      <Callout tone="success" title="What changed this round">
        The last critical is closed: merchant refunds now debit net, credit the buyer gross, reverse
        the platform fee, and lock both wallets. Transfer, merchant pay, and mint now use row
        locks; Money/decimal.js covers those paths; Firebase Admin JSON is gone from the tree;
        logout blacklists access tokens; new wallets use AES-256-GCM.
      </Callout>

      <Callout tone="warning" title="Verdict">
        Money-path integrity is in much better shape. Do not call this fully production-hardened
        yet: admin/merchant sessions are still readable by JavaScript, escrow burn still uses
        floating point, and fee reverse can no-op if treasury is short. Fine for a controlled
        pilot; not yet for unrestricted live volume.
      </Callout>

      <Grid columns={4} gap={12}>
        <Stat value="0" label="Critical open" tone="success" />
        <Stat value="4" label="High open" tone="warning" />
        <Stat value="7 / 7" label="Original criticals closed" tone="success" />
        <Stat value="Pilot" label="Suggested readiness" />
      </Grid>

      <Divider />

      <Stack gap={8}>
        <H2>Open findings by severity</H2>
        <Text size="small" tone="secondary">
          Remaining issue count · Source: static re-review · Oct 13, 2026
        </Text>
        <BarChart
          categories={SEVERITY_NOW.map((s) => s.label)}
          series={[
            { name: "Open findings (this re-audit)", data: SEVERITY_NOW.map((s) => s.value) },
          ]}
          height={200}
        />
      </Stack>

      <Stack gap={12}>
        <H2>Prior finding status</H2>
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
        <H2>High — still open</H2>
        <Table headers={["Finding", "Why it matters"]} rows={HIGH} />
      </Stack>

      <Grid columns={2} gap={16}>
        <Stack gap={12}>
          <H2>Medium</H2>
          <Table headers={["Finding", "Notes"]} rows={MEDIUM} />
        </Stack>
        <Stack gap={12}>
          <H2>Low</H2>
          <Table headers={["Finding", "Notes"]} rows={LOW} />
        </Stack>
      </Grid>

      <Divider />

      <Stack gap={12}>
        <H2>Closed this round</H2>
        <Grid columns={2} gap={12}>
          <Card>
            <CardHeader>Ledger</CardHeader>
            <CardBody>
              <Stack gap={6}>
                <Text size="small">Refund matches collection: net out of merchant, fee out of platform</Text>
                <Text size="small">Row locks on transfer, pay-merchant, mint, refund</Text>
                <Text size="small">Money helper on mint, fees, refunds, P2P, swap</Text>
              </Stack>
            </CardBody>
          </Card>
          <Card>
            <CardHeader>Auth / secrets</CardHeader>
            <CardBody>
              <Stack gap={6}>
                <Text size="small">Admin token no longer in localStorage</Text>
                <Text size="small">Access token blacklist on logout</Text>
                <Text size="small">AES-256-GCM for new wallet keys</Text>
                <Text size="small">Firebase Admin JSON removed from the repo tree</Text>
              </Stack>
            </CardBody>
          </Card>
        </Grid>
      </Stack>

      <Stack gap={12}>
        <H2>Recommended next steps</H2>
        <Table headers={["#", "Action"]} rows={FIX_ORDER} />
      </Stack>

      <Callout tone="info" title="Scope">
        Static re-audit of source after your latest updates. Race tests were not executed here
        (they skip without TEST_DATABASE_URL). Secret values were not opened.
      </Callout>
    </Stack>
  );
}
