import { readFile, writeFile } from 'node:fs/promises';
import {
	createKeyPairSignerFromBytes,
	createSolanaRpc,
	devnet,
	generateKeyPair,
	getAddressFromPublicKey,
} from '@solana/kit';

const WALLET_FILE = 'wallet.json';

async function loadOrCreateWallet() {
	try {
		const raw = await readFile(WALLET_FILE, 'utf8');
		const bytes = Uint8Array.from(JSON.parse(raw));
		const signer = await createKeyPairSignerFromBytes(bytes);
		console.log('Loaded existing wallet from', WALLET_FILE);
		return signer;
	} catch (err) {
		if (err.code !== 'ENOENT') throw err;

		console.log('No wallet file found. Generating new keypair...');
		const keyPair = await generateKeyPair(true);

		// Node cannot export Ed25519 private keys in raw format.
		// Export as PKCS8 and take the trailing 32 bytes (the seed).
		const pkcs8 = new Uint8Array(
			await crypto.subtle.exportKey('pkcs8', keyPair.privateKey),
		);
		const privateKeyBytes = pkcs8.slice(-32);

		const publicKeyBytes = new Uint8Array(
			await crypto.subtle.exportKey('raw', keyPair.publicKey),
		);

		const secretKey = new Uint8Array(64);
		secretKey.set(privateKeyBytes, 0);
		secretKey.set(publicKeyBytes, 32);

		await writeFile(WALLET_FILE, JSON.stringify(Array.from(secretKey)));
		const address = await getAddressFromPublicKey(keyPair.publicKey);
		console.log('Saved new wallet to', WALLET_FILE, '-', address);

		return await createKeyPairSignerFromBytes(secretKey);
	}
}

const signer = await loadOrCreateWallet();
const rpc = createSolanaRpc(devnet('https://api.devnet.solana.com'));
const { value: balance } = await rpc.getBalance(signer.address).send();
const sol = Number(balance) / 1_000_000_000;

console.log('Wallet address:', signer.address);
console.log(`Balance: ${sol} SOL`);
