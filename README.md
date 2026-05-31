# AIM Protocol

> Financial access for African farmers — built on Solana.

[![Live](https://img.shields.io/badge/Live-aim--protocol.vercel.app-green)](https://aim-protocol.vercel.app/)
[![Solana](https://img.shields.io/badge/Network-Solana%20Devnet-purple)](https://explorer.solana.com/address/AhHHJTu5vodDYE2yLNet2bE6jad9F3xSfbLQdUmykKqB?cluster=devnet)
[![Anchor](https://img.shields.io/badge/Smart%20Contract-Anchor%200.31.1-blue)](https://github.com/amjadkamara/aim-program)

## What is AIM Protocol?

AIM Protocol is a decentralized microfinance platform connecting smallholder farmers across Africa to DeFi financial services. Farmers establish a verifiable on-chain identity, request crop-backed microloans, track their loan history, and build an on-chain credit record — no bank account, collateral, or paperwork required.

Originally built for the Solana Frontier Hackathon 2026. Now actively developed toward real-world deployment across Africa.

## The Problem

Over 60% of Africa's workforce depends on agriculture, yet smallholder farmers remain almost entirely excluded from formal financial systems — not because the need isn't there, but because the infrastructure was never built for them.

Traditional lending requires collateral they don't have, processes that take weeks, and interest rates of 30–60% annually that make farming unprofitable. The result: farms abandoned, food prices rising, youth leaving rural areas for cities.

**Blockchain solves this:**

- A wallet replaces a bank account — anyone with a phone can participate
- On-chain identity replaces collateral documentation
- Smart contracts replace loan officers — rules enforced transparently
- Transaction history on-chain creates a credit record over time

## Live Demo

🌍 **[https://aim-protocol.vercel.app/](https://aim-protocol.vercel.app/)**

> Connect a Phantom wallet set to **Solana Devnet** to interact with the live smart contract.
> Free devnet SOL available at [faucet.solana.com](https://faucet.solana.com)

## What's Built — V2.1

### Smart Contract (Rust + Anchor)

- **PDA enforcement** — `seeds = [b"farmer", owner]` guarantees one wallet = one Farmer ID, enforced on-chain. Duplicate registration is impossible.
- **PDA-based loan accounts** — `seeds = [b"loan", owner]` replaces random keypairs. No keypair management on the frontend.
- **Loan lifecycle** — request, repay, re-borrow. Loan account closed on repayment via `close = owner`, returning rent SOL to the farmer and freeing the PDA for a new loan.
- **`close_loan` instruction** — migration instruction for legacy accounts.
- **Full test suite** — 5/5 passing: create, duplicate block, request, active loan block, repay and close.

### Frontend (React + Vite)

- **Farmer ID registration** — on-chain identity with name, crop type, district, farm size. Detects existing registration instantly.
- **Loan Dashboard** — real-time loan status showing ACTIVE / OVERDUE / REPAID with days remaining and deadline.
- **Repay Loan UI** — full repayment screen with on-chain transaction via Phantom.
- **Loan History** — complete borrowing record parsed from Solana transaction history. Shows per-loan amount, dates, status, and Solana Explorer links.
- **Plain English errors** — `parseAnchorError()` maps all Solana/Anchor errors to farmer-readable messages.
- **Wallet status banner** — detects wrong network and low SOL balance. Links directly to devnet faucet.
- **Mobile responsive** — tested at 375px. Full width buttons, no truncation, clean layout on all screens.

## User Flow

```
Connect Wallet
     ↓
Create Farmer ID (one per wallet, enforced on-chain)
     ↓
My Dashboard (profile + loan status)
     ↓
Request Microloan (gated by Farmer ID)
     ↓
Repay Loan (account closed, rent returned)
     ↓
View Loan History (on-chain transaction record)
     ↓
Re-borrow (seamless cycle)
```

## Tech Stack

| Layer          | Technology                       |
| -------------- | -------------------------------- |
| Blockchain     | Solana Devnet                    |
| Smart Contract | Rust + Anchor 0.31.1             |
| Frontend       | React + Vite                     |
| Styling        | Tailwind CSS v4                  |
| Wallet         | Phantom + Solana Wallet Adapter  |
| Icons          | Lucide React                     |
| Hosting        | Vercel (auto-deploy from GitHub) |

## Repository Structure

```
aim-protocol/          ← Frontend (this repo)
  src/
    App.jsx            ← Routing and page management
    Dashboard.jsx      ← Farmer profile + loan status
    FarmerID.jsx       ← Registration form
    Microloan.jsx      ← Loan request form
    RepayLoan.jsx      ← Loan repayment screen
    LoanHistory.jsx    ← On-chain transaction history
    WalletStatus.jsx   ← Network and balance warnings
    useAimProgram.js   ← Smart contract hook + PDA helpers
    Layout.jsx         ← Persistent navbar and footer

aim-program/           ← Smart contract (separate repo)
  programs/aim-program/src/lib.rs   ← Rust program
  tests/aim-program.ts              ← Anchor test suite
```

**Smart contract repo:** [github.com/amjadkamara/aim-program](https://github.com/amjadkamara/aim-program)

**Program ID:** `AhHHJTu5vodDYE2yLNet2bE6jad9F3xSfbLQdUmykKqB` on Solana devnet

## Running Locally

```bash
# Clone
git clone https://github.com/amjadkamara/aim-protocol.git
cd aim-protocol

# Install
npm install

# Run
npm run dev
```

> Make sure Phantom is installed and set to **Devnet** before connecting.

## Roadmap

### Phase 3 — Production Ready

- [ ] Credit scoring based on repayment history
- [ ] USDC stablecoin disbursement instead of SOL
- [ ] KYC integration — government ID tied to wallet
- [ ] Admin/lender dashboard for cooperatives and NGOs
- [ ] Public farmer profile lookup by wallet address
- [ ] Oracle integration for crop price feeds

### Phase 4 — Mainnet Launch

- [ ] Security audit
- [ ] Solana mainnet deployment
- [ ] Custom domain via Aadios Systems
- [ ] Pilot with one African farming cooperative
- [ ] Mobile-first PWA for low-bandwidth environments

### Phase 5 — Scale

- [ ] Expand beyond Sierra Leone to West Africa
- [ ] Multi-sig loan approval for cooperatives
- [ ] NGO and government oversight portal
- [ ] Integration with existing agricultural databases
- [ ] Superteam Africa chapter support

## Built By

**Amjad Kamara** — Founder, Aadios Systems (SL) Ltd.
Sierra Leone 🇸🇱 • Building for Africa on Solana 🌍

## License

MIT
