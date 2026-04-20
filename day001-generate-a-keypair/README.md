# Day 001 — Generate a Keypair

Generate a fresh Solana keypair, airdrop devnet SOL to it, verify the balance.

## Install

```bash
bun install
```

## Scripts

### `create-wallet.mjs`

Generates a new keypair in memory and prints the public address.

```bash
node create-wallet.mjs
```

Each run produces a **different** address — the private key lives only in memory and is discarded when the process exits.

### `check-balance.mjs`

Queries devnet for the balance of a hardcoded funded address and prints it in SOL.

```bash
node check-balance.mjs
```

Replace the address in the script with your own after funding it via [faucet.solana.com](https://faucet.solana.com/) (select **Devnet**).

## Flow

1. `node create-wallet.mjs` → copy the printed address.
2. Go to [faucet.solana.com](https://faucet.solana.com/), select Devnet, paste the address, request airdrop.
3. Edit `check-balance.mjs` — replace the address literal with your funded address.
4. `node check-balance.mjs` → see balance in SOL.

## Notes

- Run with **Node**, not Bun. `@solana/rpc` calls `setMaxListeners(n, AbortSignal)` which Bun's `node:events` shim doesn't support — throws `TypeError: undefined is not a function`.
- `generateKeyPairSigner()` creates a fresh keypair each run. No persistence — Day 2 solves that.
- Lamports → SOL: divide by `1_000_000_000` (1 SOL = 10⁹ lamports).

## Stack

- [`@solana/kit`](https://github.com/anza-xyz/kit) — modular Solana JS SDK (successor to `@solana/web3.js`)
- Devnet RPC: `https://api.devnet.solana.com`
