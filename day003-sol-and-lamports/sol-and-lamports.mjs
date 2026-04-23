import { readFile } from 'node:fs/promises';
import {
	address as toAddress,
	createKeyPairSignerFromBytes,
	createSolanaRpc,
	devnet,
} from '@solana/kit';

const LAMPORTS_PER_SOL = 1_000_000_000n;

const arg = process.argv[2];
const rpc = createSolanaRpc(devnet('https://api.devnet.solana.com'));

async function resolveAddress() {
	if (arg) return toAddress(arg);
	const raw = await readFile('../day002-persistent-wallet/wallet.json', 'utf8');
	const bytes = Uint8Array.from(JSON.parse(raw));
	const signer = await createKeyPairSignerFromBytes(bytes);
	return signer.address;
}

function formatSol(lamports) {
	const whole = lamports / LAMPORTS_PER_SOL;
	const frac = lamports % LAMPORTS_PER_SOL;
	return `${whole}.${frac.toString().padStart(9, '0')}`;
}

const address = await resolveAddress();
console.log('Address:', address);

const { value: lamports } = await rpc.getBalance(address).send();
console.log();
console.log('--- Balance ---');
console.log(`Lamports: ${lamports}`);
console.log(`SOL:      ${formatSol(lamports)}`);
console.log(`Check:    ${lamports} / 10^9 = ${formatSol(lamports)} SOL`);

console.log();
console.log('--- Recent transactions ---');
const sigs = await rpc.getSignaturesForAddress(address, { limit: 5 }).send();
if (sigs.length === 0) {
	console.log('No transactions yet. Airdrop first: solana airdrop 1 --url devnet');
	process.exit(0);
}

for (const { signature, slot } of sigs) {
	const tx = await rpc
		.getTransaction(signature, {
			commitment: 'confirmed',
			maxSupportedTransactionVersion: 0,
		})
		.send();
	if (!tx) continue;
	const feeLamports = tx.meta.fee;
	console.log(`slot ${slot}  sig ${signature.slice(0, 16)}...`);
	console.log(`  fee: ${feeLamports} lamports = ${formatSol(feeLamports)} SOL`);
}
