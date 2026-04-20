# 100 Days of Solana

Daily Solana exercises. One folder per day.

## Setup

Each day is a standalone package. `cd` into the day folder, install deps, run scripts.

```bash
cd day001-generate-a-keypair
bun install        # or: npm install
node create-wallet.mjs
```

Scripts use `@solana/kit`. Run with **Node**, not Bun — `@solana/rpc` uses `setMaxListeners(n, AbortSignal)` which Bun doesn't implement.

## Days

| Day | Topic |
|-----|-------|
| [001](./day001-generate-a-keypair) | Generate a keypair, airdrop devnet SOL, check balance |
