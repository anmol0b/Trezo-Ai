# Trezo AI — Treasury OS

> The onchain CFO for modern SaaS companies.

Trezo AI is an AI-powered programmable treasury platform built on Solana. It autonomously manages department budgets, routes idle funds to yield, enforces spending rules at the token transfer level, and converts stablecoins to fiat — all with a full onchain audit trail and privacy-preserving payouts.

---

## Architecture

### System Layers

![System Layers](/apps/frontend/public/architecture/system-layers.png)

### Data Flow

![Data Flow](/apps/frontend/public/architecture/data-flow.png)

---

## What It Does

Most companies manage treasury through spreadsheets, manual approvals, and disconnected banking tools. Trezo AI replaces that entire stack with a single onchain system.

**The core loop:**

```
Invoice arrives → AI parses it → Multisig approves → Transfer hook enforces rules → Funds move
                                                                 ↓
                                           Idle funds auto-deposit to Kamino yield
                                                                 ↓
                                           Pyth oracle triggers fiat conversion via Dodo
```

**Key features:**

- **AI Invoice Processing** — Upload a PDF invoice. Groq LLM parses vendor, amount, category, and due date in under 10 seconds. RAG checks vendor history and flags anomalies before creating an onchain proposal.
- **Programmable Spending Rules** — Token-2022 transfer hooks enforce rules on every transfer — max payout, daily limits, recipient allowlists, time window restrictions. Cannot be bypassed.
- **Multisig Treasury** — Every payout requires M-of-N approval. The AI agent can propose but never execute alone.
- **Auto-Yield** — Background job polls vault balances every 15 minutes. Idle USDC above threshold auto-deposits to Kamino.
- **Fiat Conversion** — Pyth oracle watches USDC/USD rate. On trigger, emits onchain event and calls Dodo Payments API to wire funds to a target IBAN.
- **Privacy-Preserving Payouts** — Umbra stealth addresses hide real recipients. Auditors get encrypted viewing keys — read-only, no spending authority.
- **Full Audit Trail** — Every action writes to an immutable onchain AuditLog.

---

## Current Status

| Area | Status |
|------|--------|
| `apps/backend` — routes, agent, jobs, services | ✅ Complete |
| `apps/backend` — tests (unit + integration) | ✅ Complete |
| `programs/trezo-core` — Anchor program | 🔨 In progress |
| `apps/frontend` — dashboard UI | ⬜ Not started |
| End-to-end devnet testing | ⬜ Blocked until program deploys |

**Known gaps:**
- Frontend is still the default Next.js scaffold — no operator workflow yet.
- The backend route modules are fully implemented but the default dev script still starts a health-only server. The fuller API in `apps/backend/src/routes/` needs to be promoted into the main entrypoint.
- `Anchor.toml` is currently configured for localnet. Align to devnet before running full integration tests.
- End-to-end devnet testing requires a deployed program ID and synced IDL.

---

## Repo Structure

```
trezo-ai/
├── apps/
│   ├── backend/           # Express API + AI agent + background jobs
│   │   └── src/
│   │       ├── agent/     # invoice-parser, rag, proposal-builder, solana-client
│   │       ├── jobs/      # yield-poller, oracle-watcher
│   │       ├── routes/    # invoices, treasury, proposals, fiat, audit
│   │       ├── services/  # anchor, helius, pyth, dodo
│   │       └── utils/     # amount, pubkey, date, retry helpers
│   └── frontend/          # Next.js 14 dashboard (in progress)
├── packages/
│   ├── ui/                # Shared UI components
│   ├── types/             # Shared TypeScript types
│   ├── eslint-config/
│   └── typescript-config/
├── programs/
│   ├── trezo-core/        # Main Anchor program
│   └── trezo-hook/        # Token-2022 transfer hook
├── tests/
│   ├── e2e/               # End-to-end tests
│   └── fixtures/          # Test accounts and PDAs
└── scripts/
    ├── sync-idl.sh        # Copies generated IDL to frontend + backend
    └── deploy.sh          # Deploys programs to devnet
```

---

## Getting Started

### Prerequisites

```
node >= 20
pnpm >= 9
rust (stable)
solana-cli >= 1.18
anchor-cli == 0.30.x
```

### Install

```bash
git clone https://github.com/your-org/trezo-ai
cd trezo-ai
pnpm install
```

### Configure backend environment

```bash
cp apps/backend/.env.example apps/backend/.env
```

**Required:**

```bash
SOLANA_RPC_URL=https://devnet.helius-rpc.com/?api-key=YOUR_KEY
HELIUS_API_KEY=YOUR_KEY        # free at helius.dev
PROGRAM_ID=YOUR_PROGRAM_ID     # from anchor deploy
AGENT_KEYPAIR=[1,2,3...]       # from solana-keygen new
GROQ_API_KEY=YOUR_KEY          # free at console.groq.com
```

**Optional:**

```bash
PINECONE_API_KEY=              # vector search for RAG
DODO_API_KEY=                  # fiat conversion tests
FIAT_CONVERSION_AMOUNT_USDC=
FIAT_TARGET_IBAN=
FIAT_TARGET_CURRENCY=
```

Generate an agent keypair:

```bash
solana-keygen new --outfile agent-keypair.json
cat agent-keypair.json
# Paste the JSON array into AGENT_KEYPAIR in .env
```

### Build and deploy programs

```bash
anchor build
anchor deploy --provider.cluster devnet
bash scripts/sync-idl.sh
```

The backend expects the IDL at `apps/backend/src/idl/trezo_core.json`. Without it, program-backed flows fail gracefully with a warning — the server still starts.

### Run locally

```bash
# All apps in parallel
pnpm dev

# Individual apps
pnpm dev:backend    # http://localhost:4000
pnpm dev:frontend   # http://localhost:3000
```

---

## Backend API

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/health` | Health check |
| POST | `/api/invoices/parse` | PDF → AI parse → return summary for review |
| POST | `/api/invoices/confirm` | Confirmed invoice → propose_payout onchain |
| GET | `/api/treasury/:companyId` | Treasury snapshot |
| GET | `/api/treasury/:companyId/departments` | All departments |
| GET | `/api/proposals/:companyId` | All proposals, filterable by status |
| GET | `/api/proposals/:companyId/:pubkey` | Single proposal |
| POST | `/api/fiat/convert` | Trigger fiat conversion via Dodo |
| GET | `/api/fiat/status/:id` | Conversion status |
| GET | `/api/audit/events` | Cached stealth payment events |
| GET | `/api/audit/events/:ephemeralPubkey` | Single stealth event |

---

## Onchain Program

### Current instructions (`programs/trezo-core`)

```
initialize_treasury       initialize_department     initialize_oracle
register_viewing_key      propose_payout            deposit_yield
trigger_fiat_conversion
```

### Full instruction set (in progress)

```
initialize_treasury       create_department         fund_department
propose_payout            approve_payout            execute_payout
batch_execute             create_spending_rule      configure_yield
deposit_yield             withdraw_yield            configure_oracle
trigger_fiat_conversion   register_viewing_key      set_agent_authority
pause_treasury            unpause_treasury
```

### PDAs

| Account | Seeds | Purpose |
|---------|-------|---------|
| `TreasuryConfig` | `[treasury, company_id]` | Global treasury state |
| `DepartmentAccount` | `[department, treasury_pda, dept_id]` | Per-department budget |
| `DeptVaultAuthority` | `[vault_auth, dept_pda]` | Vault token authority |
| `SpendingRule` | `[rule, dept_pda, rule_index]` | Transfer hook rules |
| `PayoutProposal` | `[proposal, treasury_pda, nonce]` | Payout proposal state |
| `YieldPosition` | `[yield, dept_pda]` | Kamino yield position |
| `OracleConfig` | `[oracle, treasury_pda]` | Pyth feed + rate trigger |
| `AgentAuthority` | `[agent, treasury_pda]` | AI agent permissions |
| `ViewingKeyRegistry` | `[viewing_key, treasury_pda, viewer]` | Auditor viewing keys |
| `AuditLog` | `[audit, treasury_pda, index]` | Immutable action log |

---

## Running Tests

```bash
cd apps/backend
pnpm test              # run all tests
pnpm test:watch        # watch mode
pnpm test:coverage     # with coverage report
```

Test structure:

```
apps/backend/tests/
├── setup.ts                       # Global env + mock setup
├── mocks/
│   ├── agent.mock.ts              # LLM-agnostic invoice parser mock
│   ├── anchor.mock.ts             # Program + PDA stubs
│   └── helius.mock.ts             # WebSocket + balance stubs
├── unit/
│   ├── utils.test.ts
│   ├── invoice-parser.test.ts
│   └── proposal-builder.test.ts
└── integration/
    ├── routes.invoices.test.ts
    ├── routes.treasury.test.ts
    ├── routes.proposals.test.ts
    ├── routes.fiat.test.ts
    └── routes.audit.test.ts
```

Anchor program tests:

```bash
anchor test                # runs on localnet
cargo test -p trezo-core   # unit tests
```

---

## Authentication

No login, no signup, no JWT. Wallet connection is authentication.

```
connect wallet     → identifies user (pubkey)
sign transaction   → proves authorization
disconnect         → logs out
```

Role checks in the frontend are for UI gating only. Real enforcement is always onchain via Anchor program constraints.

---

## Contributing

```bash
# Always branch from develop
git checkout develop
git pull origin develop
git checkout -b feat/your-feature

# Commit format
feat:      new feature
fix:       bug fix
chore:     deps, config, scripts
test:      adding or fixing tests
docs:      README, comments

# PR into develop, not main
# develop → main at end of each weekly milestone
```

---

## Stack

| Layer | Technology |
|-------|-----------|
| Onchain program | Anchor v0.30, Rust |
| Transfer hook | Token-2022, Anchor v0.30 |
| Privacy | Umbra stealth addresses |
| Yield | Kamino CPI |
| Oracle | Pyth Network |
| Fiat | Dodo Payments API |
| AI / LLM | Groq (llama-3.1-8b-instant) |
| Vector DB | Pinecone (optional, pseudo-embed fallback) |
| Backend | Node.js 20, TypeScript, Express |
| Frontend | Next.js 14, Tailwind CSS, shadcn/ui |
| Wallet | Solana Wallet Adapter (Phantom, Backpack) |
| RPC | Helius devnet |
| Monorepo | Turborepo + pnpm workspaces |

---

## Roadmap

- [ ] Complete Anchor program — approve_payout, execute_payout, spending rules
- [ ] Frontend operator workflow — invoice to proposal to payout
- [ ] Full devnet integration test loop
- [ ] Transfer hook enforcement on devnet USDC-2022 mint
- [ ] Mainnet deployment (post-audit)
- [ ] MagicBlock Private Ephemeral Rollups
- [ ] Multi-LLM support (Anthropic, OpenAI alongside Groq)
- [ ] Multi-company isolation
- [ ] ZK proof amount hiding

---

*Trezo AI · Treasury OS · Anchor v0.30 · Token-2022 · Groq · Kamino · Pyth · Dodo Payments*