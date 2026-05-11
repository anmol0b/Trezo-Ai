# Contributing to Trezo AI

Thanks for your interest in Trezo. This document covers how to get the project running locally and how we work.

---

## Prerequisites

```
node >= 20
pnpm >= 9
rust (stable)
solana-cli >= 1.18
anchor-cli == 0.30.x
```

---

## Setup

```bash
git clone https://github.com/anmol0b/Trezo-Ai
cd trezo-ai
pnpm install
```

Configure backend environment:

```bash
cp apps/backend/.env.example apps/backend/.env
# fill in required values
```

Run locally:

```bash
pnpm dev          # all apps in parallel
pnpm dev:backend  # backend only — http://localhost:4000
pnpm dev:frontend # frontend only — http://localhost:3000
```

---

## Environment Variables

Required for backend (`apps/backend/.env`):

```
SOLANA_RPC_URL       # Helius devnet RPC URL
HELIUS_API_KEY       # helius.dev
HELIUS_WS_URL        # wss://devnet.helius-rpc.com/?api-key=...
PROGRAM_ID           # from anchor deploy
HOOK_PROGRAM_ID      # transfer hook program ID
AGENT_KEYPAIR        # JSON array from solana-keygen new
GROQ_API_KEY         # console.groq.com
DATABASE_URL         # Supabase connection string (pooler port 6543)
```

Generate an agent keypair:

```bash
solana-keygen new --outfile agent-keypair.json
cat agent-keypair.json  # paste into AGENT_KEYPAIR
```

---

## Database

```bash
pnpm migrate   # run schema migrations
pnpm seed      # seed demo data (companies, users, invoices)
```

---

## Anchor Programs

```bash
anchor build                    # compile programs
anchor deploy --provider.cluster devnet  # deploy to devnet
bash scripts/sync-idl.sh        # sync IDL to frontend + backend
```

Initialize onchain treasury after deploy:

```bash
pnpm init-treasury
```

---

## Tests

```bash
cd apps/backend
pnpm test           # unit + integration (49 tests)
pnpm test:coverage  # with coverage report

anchor test         # Anchor program tests (localnet)
```

---

## Branch Conventions

```
feat/     new feature
fix/      bug fix
chore/    deps, config, scripts
docs/     README, comments
test/     adding or fixing tests
```

Branch from `main`, PR back into `main`. All PRs require one review (owner can bypass).

---

## Architecture

The monorepo is structured as:

- `apps/backend` — Express API, AI agent, background jobs, Anchor client
- `apps/frontend` — Next.js 14 dashboard
- `programs/trezo-core` — Main Anchor program (treasury, proposals, yield, oracle, privacy)
- `programs/trezo-hook` — Token-2022 transfer hook (spending rule enforcement)
- `scripts/` — Init, seed, and sync utilities
- `tests/e2e/` — End-to-end Anchor program tests

---

*Questions? Open an issue or reach out on X [@trezoai](https://x.com/trezoai)*