# Superteam Agentic Engineering Grant Draft

Submit here: https://superteam.fun/earn/grants/agentic-engineering

## Step 1: Basics

**Project Title**
> Kosh AI

**One Line Description**
> An AI treasury copilot for Solana teams that parses invoices, drafts on-chain payout proposals, monitors idle balances for yield, and automates auditable fiat conversion triggers.

**TG username**
> t.me/anmol0b  

this is my telegram we haven't made telegram for our product yet , will be making that soon
**Wallet Address**
> 7FY7ETtZeuhMAzPaYcWU2FzfCGfSsNxmWmXkmconLSdM

## Step 2: Details

**Project Details**
> Kosh AI is building an AI-native treasury operations layer for Solana teams. Today, finance workflows for crypto-native organizations are still fragmented across PDFs, chat threads, spreadsheets, banking tools, and on-chain multisigs. That creates slow payout cycles, weak auditability, and too much manual work for routine treasury actions like invoice review, treasury monitoring, and fiat off-ramping.
>
> The product approach is to keep humans in control while moving repetitive treasury work into an agentic system. In the current prototype, Kosh AI can ingest invoice PDFs, extract structured invoice data with an LLM, look up vendor history through a lightweight RAG layer, generate proposal summaries for human review, and then prepare and submit Solana payout proposal instructions. The backend also exposes treasury and proposal APIs, fiat conversion APIs, and audit event endpoints, while background jobs watch Pyth price conditions, monitor idle balances for yield deployment, and index on-chain audit events.
>
> The repo now includes the first on-chain implementation pass as well. A new Anchor workspace and `koshai-core` program define the treasury, department, payout proposal, agent authority, yield position, oracle config, and viewing key accounts, along with the first instruction surface the backend already expects: `initialize_treasury`, `initialize_department`, `initialize_oracle`, `register_viewing_key`, `propose_payout`, `deposit_yield`, and `trigger_fiat_conversion`. The next phase is to generate and sync the IDL, replace the placeholder frontend workflow, and validate the full invoice-to-proposal-to-audit loop on devnet with pilot treasury operators.

**Deadline**
> Suggested deadline: May 05, 2026, 11:59 PM Asia/Calcutta. Replace this if you already have a different target ship date.

**Proof of Work**
> GitHub repo: https://github.com/anmol0b/Kosh-AI
>
> Current branch: `develop`
>
> Development activity: 28 commits in the repo, with active backend implementation work on April 20, 2026.
>
> Recent concrete work from git history:
> `8a23bf4` added invoice parse/confirm endpoints
> `a449486` added treasury and departments endpoints
> `b97002e` added proposal list and single-proposal endpoints
> `7177ffe` added fiat conversion and status endpoints
> `f485dff` added audit routes for stealth payment events
> `b77459b` and `0e2828a` added yield polling and oracle watcher background jobs
> `35e9653` added Solana client flows for propose payout, deposit yield, and fiat conversion triggers
> `e229606` added the invoice RAG pipeline with Pinecone plus pseudo-embedding fallback
> `ae1b975` added the Groq-powered invoice parser
>
> Implemented backend artifacts in the repo today:
> `apps/backend/src/agent/` for AI parsing, proposal construction, retrieval, and Solana transaction flows
> `apps/backend/src/routes/` for invoices, treasury, proposals, fiat, and audit APIs
> `apps/backend/src/jobs/` for oracle watching and idle-yield automation
> `apps/backend/src/services/` for Anchor, Helius RPC/WebSocket, Pyth, and Dodo integrations
>
> Implemented on-chain artifacts in the repo today:
> `Anchor.toml` and workspace `Cargo.toml`
> `programs/koshai-core/src/lib.rs` with the first Anchor program pass aligned to the backend PDA seeds and instruction names
> updated IDL sync flow so `anchor build` can feed the backend and frontend from `target/idl/koshai_core.json`
>
> Verification completed during this session:
> `codex-session.jsonl` exported into the project root as the AI-assisted development transcript
> `pnpm --filter frontend build` passes
> `pnpm --filter backend build` passes after fixing the empty backend TypeScript config
> `cargo check -p koshai-core` passes for the new Anchor program
> the frontend is still an early scaffold, and the remaining on-chain integration step is generating and syncing the IDL with `anchor build`
>
> Public demo: not published yet

**Personal X Profile**
> x.com/anmol0b

**Personal GitHub Profile**
> github.com/anmol0b

**Colosseum Crowdedness Score**
> Visit https://colosseum.com/copilot, generate the Crowdedness Score for Kosh AI, take a screenshot, upload it to a public Google Drive link, and paste that link here.

**AI Session Transcript**
> Attach `/Users/anmolbhardwaj/Developer/Work/Projects/kosh-ai/codex-session.jsonl`

## Step 3: Milestones

**Goals and Milestones**
> 1. By April 24, 2026: stabilize the backend prototype for clean local builds, finalize required environment setup documentation, and lock the invoice parsing, RAG, treasury, proposal, fiat, and audit API contracts.

> 2. By April 27, 2026: replace the placeholder frontend with a treasury operator workflow covering invoice upload, AI review, proposal confirmation, treasury dashboards, and audit event inspection.

> 3. By April 30, 2026: complete end-to-end devnet integration for invoice-to-proposal submission, yield deposit triggers, and fiat conversion trigger flows connected to the Anchor program and IDL.

> 4. By May 3, 2026: run pilot scenarios across at least 2 treasury setups, collect operator feedback, and refine anomaly detection, audit clarity, and failure recovery behavior.

> 5. By May 5, 2026: publish the final polished demo, walkthrough documentation, and proof of successful agent-assisted treasury operations on Solana.


**Primary KPI**
> Suggested KPI: 10 successful invoice-to-proposal submissions on devnet through Kosh AI's agent workflow. Confirm or replace this with your preferred metric.

**Final tranche checkbox**
> Check this only if you understand that the final tranche requires your Colosseum project link, GitHub repo, and AI subscription receipt.

## Submission Checklist

- `codex-session.jsonl` in the project root
- Colosseum Crowdedness Score screenshot uploaded to a public link
- The copy-paste text above with your Telegram, wallet, X profile, and final deadline filled in
- Grant submission link: https://superteam.fun/earn/grants/agentic-engineering
