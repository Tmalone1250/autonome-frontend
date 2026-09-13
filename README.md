# 🎨 Autonome User Studio & Node Operator Dashboard

This repository contains the frontend client for the **Autonome Decentralized AI Protocol**, built exclusively for the BOT Chain ecosystem. It serves as both the entry point for users prompting the AI network and the command center for DePIN Node Operators managing their compute workloads.

---

## 🛠️ Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Styling:** Tailwind CSS v4 + Lucide React Icons
- **Web3 Integration:** `wagmi`, `viem`, and `@tanstack/react-query`
- **Smart Accounts:** Native ERC-4337 Account Abstraction (EntryPoint v0.7)
- **Network:** Bohr Testnet (Chain ID 968)

---

## 🚀 Key Features

### 1. User Agent Studio
A dynamic interface for submitting natural language intents to the Autonome protocol.
- Select from modular domains (Web3 & DeFi, Code & Dev, Media, Utility).
- Automatically calculates estimated compute costs (in ATMA) before submission.
- Streams the live execution pipeline: from Orchestrator intent parsing (Llama 3), to Sub-Agent on-chain context enrichment, down to final cryptographic DePIN settlement.

### 2. Node Operator Command Center
A comprehensive dashboard for users running local Autonome Compute Worker nodes.
- **Hardware Telemetry:** Monitors system status (Active/Offline).
- **Execution Log Ledger:** Fetches and displays a persistent SQLite ledger of verified cryptographic compute tasks, proof hashes, and settlement TXs.
- **ERC-4337 Vault Deployment:** Node operators can seamlessly deploy a deterministic Smart Account Vault via `SimpleAccountFactory`. This cleanly isolates Operator earnings from the hot, internet-facing private execution keys on the node hardware.
- **Dynamic Balance Hydration:** Automatically falls back to tracking hot-wallet balances if a vault is undeployed, and shifts strictly to tracking vault balances upon successful network deployment.

---

## ⚙️ Setup & Local Development

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Development Server
```bash
npm run dev
```
The User Studio will be available at [http://localhost:3000](http://localhost:3000).

### 3. Web3 Wallet Configuration
To interact with the smart contracts (and deploy the ERC-4337 Vault), ensure your browser wallet (e.g., MetaMask) is connected to the **Bohr Testnet**:
- **Network Name:** Bohr Testnet
- **RPC URL:** `https://rpc.bohr.life`
- **Chain ID:** 968
- **Currency Symbol:** tBOT

---

## 🔗 Architecture Interop

This frontend is designed to run in tandem with the [Autonome Backend Infrastructure](https://github.com/tmalone1250/autonome). 
- It POSTs user prompts directly to the Orchestrator service on `http://localhost:8001/orchestrate`.
- It relies on the Worker Node API on `http://localhost:8000` to fetch telemetry and the persistent execution logs.
