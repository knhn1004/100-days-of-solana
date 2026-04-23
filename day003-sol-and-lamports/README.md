# Day 003 — SOL and Lamports

Query a devnet wallet balance in both SOL and lamports, then inspect transaction fees.

## Run

```bash
bun install
# uses ../day002-persistent-wallet/wallet.json by default
node sol-and-lamports.mjs

# or pass any devnet address
node sol-and-lamports.mjs <BASE58_ADDRESS>
```

Equivalent CLI check:

```bash
solana balance --url devnet
solana balance --url devnet --lamports
```

## Key ideas

- **1 SOL = 1,000,000,000 lamports** (10^9). Lamport is the indivisible unit.
- RPC `getBalance` returns **lamports as a `bigint`**. Never cast to `Number` for money — floats lose precision past 2^53.
- Convert with integer math: `whole = lamports / 10^9n`, `frac = lamports % 10^9n`.
- Validators must agree byte-for-byte; floating point is non-deterministic, so Solana uses integer lamports end-to-end.
- Transaction fees live on `tx.meta.fee` (lamports). Base fee is 5000 lamports per signature.
