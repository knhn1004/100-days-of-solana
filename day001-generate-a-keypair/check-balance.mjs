import { createSolanaRpc, devnet, address } from '@solana/kit';

const rpc = createSolanaRpc(devnet('https://api.devnet.solana.com'));

const funded = address('FWfsV8wkM5EYk6XMK5qFokBRk9rwaRpqFEWz8zjvDJMc');

const { value: balance } = await rpc.getBalance(funded).send();
const balanceInSol = Number(balance) / 1_000_000_000;

console.log('Wallet address:', funded);
console.log(`Balance: ${balanceInSol} SOL`);
