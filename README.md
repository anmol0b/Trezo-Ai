# Trezo AI

**Autonomous treasury infrastructure for internet-native companies.**

[![Live](https://img.shields.io/badge/live-trezoai.xyz-brightgreen)](https://trezoai.xyz)
[![Solana](https://img.shields.io/badge/solana-devnet-purple)](https://explorer.solana.com/address/47qSrNsBPRje72jF1qfeTvTzkpJz5PUuFw9JBDRsCzDn?cluster=devnet)
[![License](https://img.shields.io/badge/license-Apache%202.0-blue)](LICENSE)


## The Problem

Crypto-native companies manage treasury the same way everyone else does — spreadsheets, email approvals, and disconnected banking tools. Stablecoins sit idle. Invoices get paid manually. There's no onchain audit trail. Finance teams spend hours on work that should be automated.

## What We Built

Trezo is a programmable treasury operating system built on Solana. It automates the entire treasury workflow — from invoice intake to budget enforcement, yield optimization, and fiat settlement — with every action recorded onchain.

<!-- ```
Invoice arrives → AI parses it → Multisig approves → Transfer hook enforces rules → Funds move
                                                               ↓
                                         Idle USDC auto-routes into Kamino yield (~3.15% APY)
                                                               ↓
                                         Pyth oracle triggers fiat settlement when rate hits target
``` -->

---

## Core Capabilities

**AI Invoice Processing** — Upload a PDF. Groq LLM extracts vendor, amount, category, and due date in under 10 seconds. RAG checks vendor history and flags anomalies before an onchain proposal is created.

**Programmable Spending Rules** — Token-2022 transfer hooks enforce policy at the protocol level. Spending limits, daily caps, recipient allowlists, time restrictions. Enforced on every transfer, bypassed by no one.

**Multisig Treasury** — Every payout requires M-of-N approval. The AI agent proposes, humans authorize, the chain executes.

**Auto-Yield** — Idle USDC above a configurable threshold automatically routes into Kamino Finance. Background jobs monitor balances every 15 minutes. Live APY sourced directly from Kamino's mainnet market.

**Fiat Conversion** — Pyth oracle monitors USDC/USD rate. On trigger, an onchain event fires and fiat settlement initiates via SEPA/ACH bank rails through Coinflow.

**Privacy-Preserving Payouts** — Stealth addresses hide recipient identities onchain. Auditors get encrypted viewing keys — read-only, no spending authority. Everything is verifiable without being public.

**Immutable Audit Trail** — Every action writes to an onchain AuditLog. Proposals, approvals, transfers, yield events, fiat triggers. Nothing is deletable.

---

# Product Architecture

## System Layers

![System Layers](/apps/frontend/public/architecture/system-layers.png)

Trezo is built as a modular treasury stack composed of:

- AI automation agents
- programmable treasury controls
- yield orchestration systems
- fiat settlement infrastructure
- onchain audit mechanisms
- privacy-preserving payout systems

Each layer is designed to operate independently while remaining fully connected through onchain execution and treasury state management.

---

## Data Flow

![Data Flow](/apps/frontend/public/architecture/data-flow.png)

The treasury workflow inside Trezo follows a continuous automation loop:

## Live Product

| | |
|---|---|
| Dashboard | [trezoai.xyz](https://trezoai.xyz) |
| Program (devnet) | `47qSrNsBPRje72jF1qfeTvTzkpJz5PUuFw9JBDRsCzDn` |
| Transfer Hook | `AkVudTF3DrGYYHeEC3ACL8LRB77GQF7G8N63ZMTX6kYe` |

---

## Stack

Solana · Anchor v0.30 · Token-2022 · Groq · pgvector · Kamino · Pyth · Coinflow · Node.js · Next.js 14

---

## Status

| | |
|---|---|
| AI invoice parsing + RAG | ✅ |
| Onchain program (devnet) | ✅ |
| Treasury + departments + oracle | ✅ |
| Yield poller + live Kamino APY | ✅ |
| Pyth oracle watcher | ✅ |
| Helius WebSocket indexer | ✅ |
| Viewing keys (privacy) | ✅ |
| Fiat conversion (Coinflow) | ✅ |
| Subscription billing (Dodo) | ✅ |
| Frontend dashboard | ✅ |
| Full Kamino CPI execution | 🔨 Mainnet |
| Umbra stealth key derivation | 🔨 Roadmap |
| Security audit | 🔨 Pre-mainnet |

---

## Roadmap

Full payout execution loop → Real USDC vault ATAs → Kamino CPI → Transfer hook enforcement on USDC-2022 → Security audit → Mainnet

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for setup, architecture deep-dive, and how to run the full stack locally.

---

*Trezo AI · Built on Solana*