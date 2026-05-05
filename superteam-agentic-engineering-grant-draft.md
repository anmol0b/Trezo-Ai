# Superteam Agentic Engineering Grant Draft

Submit here: https://superteam.fun/earn/grants/agentic-engineering

## Step 1: Basics

**Project Title**
> Trezo AI

**One Line Description**
> An AI treasury operating system on Solana that parses invoices, enforces programmable spending rules, routes idle USDC to yield, and triggers auditable fiat payouts.

**TG username**
> t.me/anmol0b (inferred from the prior draft in this repo; confirm if unchanged)

**Wallet Address**
> 7FY7ETtZeuhMAzPaYcWU2FzfCGfSsNxmWmXkmconLSdM (inferred from the prior draft in this repo; confirm if unchanged)

## Step 2: Details

**Project Details**
> Trezo AI is building an AI-native treasury operations layer for modern SaaS and crypto-native teams on Solana. Today, treasury workflows are still fragmented across invoice PDFs, spreadsheets, chat approvals, banking tools, and onchain multisigs. That leads to slow payout cycles, weak auditability, idle capital, and too much human time spent on repetitive finance operations.
>
> Trezo AI replaces that fragmented stack with a single programmable treasury system. The current product direction is to keep humans in control while moving repetitive treasury work into an agentic workflow: invoice PDFs are parsed with an LLM, vendor context is retrieved through a lightweight RAG layer, proposal summaries are generated for review, and approved actions map into onchain payout flows. The backend already exposes invoice, treasury, proposal, fiat conversion, and audit APIs, while background jobs watch Pyth price conditions and idle balances for automated treasury actions.
>
> The repo also includes the first onchain implementation pass in Anchor. The `trezo-core` program defines treasury, department, payout proposal, oracle, yield, agent authority, audit log, and viewing-key state, with the initial instruction surface already aligned to backend flows: `initialize_treasury`, `initialize_department`, `initialize_oracle`, `register_viewing_key`, `propose_payout`, `deposit_yield`, and `trigger_fiat_conversion`. The next phase is to finish the usable operator workflow, move from localnet configuration to devnet validation, sync the IDL cleanly across services, and prove the full invoice-to-proposal-to-audit loop in live demos.

**Deadline**
> May 10, 2026, 11:59 PM Asia/Kolkata.

**Proof of Work**
> GitHub repo: https://github.com/anmol0b/Trezo-Ai
>
> Current branch: `feat/trezo-core`
>
> Development activity: 51 commits in the repo so far, with active backend, frontend, testing, and rename work visible in git history.
>
> Recent concrete work from git history:
> `deb3193` mounted all backend routes and wired jobs in `index.ts`
> `8a23bf4` added invoice parse and confirm endpoints
> `a449486` added treasury and departments endpoints
> `b97002e` added proposal list and single-proposal endpoints
> `7177ffe` added fiat conversion and status endpoints
> `f485dff` added audit endpoints for stealth payment events
> `0e2828a` and `b77459b` added oracle watcher and yield poller jobs
> `35e9653` added Solana client flows for payout proposals, yield deposits, and fiat triggers
> `7bcf658`, `e229606`, and `ae1b975` added proposal building, invoice RAG, and Groq-based invoice parsing
> `4977cb1`, `ca62124`, and `a8ddddd` added backend integration, unit, and mock test coverage
> `6938ae5`, `859cae5`, and `af1f294` added and refined the landing / coming-soon frontend
> `ff1815b` renamed the codebase from Kosh AI to Trezo AI across source files
>
> Implemented artifacts currently in the repo:
> `apps/backend/src/agent/` for invoice parsing, proposal construction, retrieval, and Solana transaction preparation
> `apps/backend/src/routes/` for invoices, treasury, proposals, fiat conversion, and audit APIs
> `apps/backend/src/jobs/` for oracle watching and idle-yield automation
> `apps/backend/src/services/` for Anchor, Solana RPC, Pyth, and Dodo integrations
> `programs/trezo-core/src/` for the Anchor program, instructions, error types, and treasury state accounts
> `README.md` documenting the architecture, PDA model, API surface, and current status
>
> Verification completed during this session:
> `codex-session.jsonl` was exported to the project root as the AI-assisted development transcript
> `pnpm --filter backend build` completed successfully
> `cargo check -p trezo-core` completed successfully, with Anchor macro cfg warnings but no blocking compile error
> `pnpm --filter backend test` does not currently pass: it reports missing `../mocks/groq.mock` and `../mocks/helius.mock` imports, and some integration tests attempt socket binding that is blocked in the sandbox
> the frontend production build was started, but I do not have a completed successful build result from this session, so I am not claiming it as verified
>
> Public demo: not published yet

**Personal X Profile**
> x.com/trezo_ai

**Personal GitHub Profile**
> github.com/anmol0b

**Colosseum Crowdedness Score**
> Visit https://colosseum.com/copilot, generate the Crowdedness Score for Trezo AI, take a screenshot, upload it to a public Google Drive link, and paste that link here.

**AI Session Transcript**
> Attach `./codex-session.jsonl`

## Step 3: Milestones

**Goals and Milestones**
> 1. By May 6, 2026: stabilize the backend entrypoint, restore missing backend test mocks, and make the invoice, treasury, proposals, fiat, and audit flows cleanly runnable in local development.
>
> 2. By May 7, 2026: complete the first usable `trezo-core` instruction surface, generate and sync the IDL across the backend and frontend, and switch configuration from localnet assumptions to devnet-ready settings.
>
> 3. By May 8, 2026: build the first treasury operator dashboard for invoice intake, AI review, proposal confirmation, treasury visibility, and audit event inspection.
>
> 4. By May 9, 2026: validate end-to-end devnet flows for invoice-to-proposal submission, yield deposit triggers, and fiat conversion triggers with audit-log verification.
>
> 5. By May 10, 2026: publish the MVP demo, walkthrough documentation, and results from at least two realistic treasury operation scenarios executed through Trezo AI.



## Submission Checklist

- `codex-session.jsonl` in the project root
- Colosseum Crowdedness Score screenshot uploaded to a public link
- Final confirmation of your Telegram URL, wallet address, X profile, and shipping deadline
- Grant submission link: https://superteam.fun/earn/grants/agentic-engineering
