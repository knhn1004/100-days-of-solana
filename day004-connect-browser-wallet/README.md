# Day 004 — Connect a Browser Wallet

Web app that detects installed Solana wallet extensions via the **Wallet Standard**, lets the user pick one, then shows the connected address and devnet SOL balance. Never asks for a private key or seed phrase — the wallet extension owns the keys.

> MLH challenge: [Connect a Browser Wallet](https://www.mlh.com/challenges/019db996-d670-c609-b3d6-5bb3fb0eeb00)

## Run

```bash
bun install
bun run dev    # http://localhost:5174
```

You need a Solana wallet extension installed (Phantom, Solflare, or Backpack), set to **devnet**, and funded:

```bash
solana airdrop 1 <YOUR_ADDRESS> --url devnet
```

## How it works

1. **Discovery** — `getWallets()` from `@wallet-standard/app` returns every wallet that has registered itself on the page. Filter to entries that include `solana:devnet` in `wallet.chains` and expose the `standard:connect` feature.
2. **Connect** — `wallet.features['standard:connect'].connect()` triggers the extension's approval popup and returns `{ accounts }`. Store the first account whose `chains` includes `solana:devnet`.
3. **Balance** — `createSolanaRpc('https://api.devnet.solana.com').getBalance(address).send()` returns lamports as a `bigint`. Format with integer math (`/ 10^9n`, `% 10^9n`) — never cast bigint lamports to `Number`.
4. **Live updates** — Subscribe to `standard:events.on('change', ...)` so the UI follows account switches inside the extension.
5. **Disconnect** — `wallet.features['standard:disconnect'].disconnect()` and `getWallets().on('register' | 'unregister', ...)` keep the wallet list in sync if extensions load or unload at runtime.

## Key ideas

- **Wallet Standard** is the cross-chain protocol that every modern Solana wallet implements. Apps no longer hard-code Phantom or Solflare adapters — they iterate over `getWallets().get()` and pick whichever wallets advertise the chains/features they need.
- **Private keys never leave the extension.** The app receives a public `address` plus signing capabilities (`solana:signTransaction`, `solana:signMessage`); the user approves each call inside the extension UI.
- **`standard:events` 'change'** fires when the wallet flips accounts or disconnects from outside the dapp. Listen for it or your UI silently desyncs.
- **Lamports stay `bigint` end-to-end.** Same reason as day 003: balances and amounts must round-trip without floating-point loss.
