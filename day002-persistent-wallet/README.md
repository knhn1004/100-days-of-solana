# Day 002 — Persistent Wallet

Generate a Solana keypair once, save it to `wallet.json`, reload on next run, and print the devnet balance.

## Run

```bash
bun install
node persistent-wallet.mjs   # first run: creates wallet.json
node persistent-wallet.mjs   # second run: reloads same wallet
```

## Key ideas

- `generateKeyPair(true)` — the `true` makes the private key **extractable** so we can export and save it.
- Node cannot export Ed25519 private keys in `raw` format. Export as **PKCS8** and slice the last 32 bytes (the seed).
- Solana secret key = 64 bytes: 32-byte private seed followed by 32-byte public key.
- `createKeyPairSignerFromBytes(bytes)` rehydrates a signer from the 64-byte array.
- Balance from `rpc.getBalance()` is in **lamports**; divide by `1_000_000_000` for SOL.

`wallet.json` holds a raw secret key — do not commit it. Already in `.gitignore`.
