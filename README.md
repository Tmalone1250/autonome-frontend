# Autonome Consumer Web Frontend (`autonome-frontend/`)

The **Autonome Consumer Web Frontend** is a modern Next.js web application that serves dual purposes:
1. **User Studio**: A natural language prompt workspace allowing users to dispatch AI autonomous agent tasks to the compute network.
2. **Node Operator Dashboard**: A real-time telemetry console where DePIN node operators monitor compute node performance, inspect verifiable execution logs, view settlement transactions on Bohr Scan, and claim earned ATMA tokens from their ERC-4337 Smart Account Vaults.
3. **Admin Control Panel**: A secure, whitelisted macro-telemetry dashboard for protocol administrators to track global network health, node activity, and orchestrator queues.

---

## Technical Stack

- **Framework**: Next.js (App Router, React 19)
- **Styling**: Tailwind CSS v4, Glassmorphism design system, Lucide React icons
- **Web3 Integration**: Wagmi v3, Viem v2, TanStack React Query v5
- **Network**: BOT Chain / Bohr Testnet (Chain ID `968`, RPC `https://rpc.bohr.life`)

---

## Component Architecture

```
autonome-frontend/src/
├── app/
│   ├── layout.tsx             # Root layout with Web3 & React Query providers
│   ├── page.tsx               # Main application container switching between views
│   └── globals.css            # Tailwind styles & theme variables
├── components/
│   ├── UserStudio.tsx         # Natural language prompt interface & intent response viewer
│   ├── NodeDashboard.tsx      # Telemetry, verifiable execution logs & ERC-4337 vault manager
│   ├── Navbar.tsx             # Navigation header, wallet connector & network status
│   ├── CreditModal.tsx        # Escrow token deposit & credit management modal
│   ├── CreditContext.tsx      # React context for tracking active user credits
│   └── Providers.tsx          # Wagmi and QueryClient context provider configuration
└── lib/
    ├── wagmi.ts               # Wagmi chain definition & RPC config for Bohr Testnet
    └── contracts.ts           # Contract ABIs and deployed addresses
```

---

## Core Views & Workflows

### 1. User Studio (`UserStudio.tsx`)
- **Intent Submission**: Users enter prompts (e.g., *"Find trending Solana meme coins with liquidity above $50k and market cap under $2M"*).
- **Orchestrator Proxying**: Dispatches `POST` requests to the Intent Orchestrator (`http://localhost:8002/prompt`).
- **Verifiable Output Rendering**: Displays raw structured JSON response, sub-agent telemetry, proof hashes, and clickable settlement transaction hashes on Bohr Scan.

### 2. Node Operator Dashboard (`NodeDashboard.tsx`)
- **Node Status Telemetry**: Displays CPU/GPU load, active worker status, listening port (8000), and ephemeral worker wallet address (`~/.autonome/worker_key.json`).
- **Verifiable Execution Log Table**: Live-updates from worker node `/logs` endpoint. Shows task IDs, proof hashes, execution durations, and settlement transaction links.
- **ERC-4337 Vault & Earnings Manager**:
  - Automatically reads the counterfactual SimpleAccount address.
  - Displays real-time ATMA token balances in the vault contract.
  - **Claim Rewards Action**: Executes `SimpleAccount.execute(ATMA_TOKEN, 0, transfer(EOA, balance))` to withdraw accumulated node operator earnings directly to the connected EOA wallet.

---

## Environment Variables Configuration

Create a `.env.local` file in `autonome-frontend/`:

```ini
# Orchestrator API Base URL
NEXT_PUBLIC_ORCHESTRATOR_URL=http://localhost:8002

# Worker Node API Base URL
NEXT_PUBLIC_WORKER_URL=http://localhost:8000

# Contract Addresses (Bohr Testnet)
NEXT_PUBLIC_ESCROW_CONTRACT_ADDRESS=0x5b30dB9F00F9fa644a13117D5b31844223e3Fb4E
NEXT_PUBLIC_ATMA_TOKEN_ADDRESS=0xd29dE89D308b3F1eAcF3c36f821842F8F6f3f840
NEXT_PUBLIC_SIMPLE_ACCOUNT_FACTORY_ADDRESS=0xBC88d6012b3bf8426C2851d3798cEB5257658332

# Chain Explorer
NEXT_PUBLIC_EXPLORER_URL=https://scan.bohr.life
```

---

## Setup & Running Locally

### 1. Install Dependencies

```bash
cd autonome-frontend
npm install
```

### 2. Launch Development Server

```bash
npm run dev
```

The application will open on `http://localhost:3000`.

### 3. Production Build & Linting

```bash
# Type check and build Next.js bundle
npm run build

# Start production server
npm run start
```
