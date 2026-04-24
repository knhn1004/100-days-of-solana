import { getWallets } from '@wallet-standard/app';
import type { Wallet, WalletAccount } from '@wallet-standard/base';
import { address as toAddress, createSolanaRpc } from '@solana/kit';

const DEVNET_CHAIN = 'solana:devnet';
const RPC_URL = 'https://api.devnet.solana.com';
const LAMPORTS_PER_SOL = 1_000_000_000n;

type ConnectFeature = {
  connect: (input?: { silent?: boolean }) => Promise<{ accounts: readonly WalletAccount[] }>;
};
type DisconnectFeature = { disconnect: () => Promise<void> };
type EventsFeature = {
  on: (
    event: 'change',
    listener: (props: { accounts?: readonly WalletAccount[] }) => void
  ) => () => void;
};

type SolanaWallet = Wallet & {
  features: {
    'standard:connect': ConnectFeature;
    'standard:disconnect'?: DisconnectFeature;
    'standard:events'?: EventsFeature;
  };
};

const rpc = createSolanaRpc(RPC_URL);

const els = {
  status: document.getElementById('status') as HTMLElement,
  walletList: document.getElementById('wallet-list') as HTMLElement,
  wallets: document.getElementById('wallets') as HTMLUListElement,
  connected: document.getElementById('connected') as HTMLElement,
  connectedName: document.getElementById('connected-name') as HTMLElement,
  address: document.getElementById('address') as HTMLElement,
  balance: document.getElementById('balance') as HTMLElement,
  refresh: document.getElementById('refresh') as HTMLButtonElement,
  disconnect: document.getElementById('disconnect') as HTMLButtonElement,
  error: document.getElementById('error') as HTMLElement
};

let active: { wallet: SolanaWallet; account: WalletAccount; offChange?: () => void } | null = null;

function isSolanaWallet(w: Wallet): w is SolanaWallet {
  return w.chains.includes(DEVNET_CHAIN) && 'standard:connect' in w.features;
}

function listWallets(): SolanaWallet[] {
  return getWallets().get().filter(isSolanaWallet);
}

function setStatus(msg: string) {
  els.status.textContent = msg;
  els.status.hidden = false;
}

function clearStatus() {
  els.status.hidden = true;
}

function setError(err: unknown) {
  const msg = err instanceof Error ? err.message : String(err);
  els.error.textContent = `Error: ${msg}`;
  els.error.hidden = false;
}

function clearError() {
  els.error.textContent = '';
  els.error.hidden = true;
}

function formatSol(lamports: bigint): string {
  const whole = lamports / LAMPORTS_PER_SOL;
  const frac = lamports % LAMPORTS_PER_SOL;
  const fracStr = frac.toString().padStart(9, '0').replace(/0+$/, '') || '0';
  return `${whole.toString()}.${fracStr}`;
}

function clearChildren(node: Element) {
  while (node.firstChild) node.removeChild(node.firstChild);
}

function renderWalletList() {
  const wallets = listWallets();
  clearChildren(els.wallets);

  if (wallets.length === 0) {
    setStatus('No Solana wallets detected. Install Phantom, Solflare, or Backpack and reload.');
    els.walletList.hidden = true;
    return;
  }

  clearStatus();
  els.walletList.hidden = false;

  for (const w of wallets) {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'wallet-btn';

    if (w.icon) {
      const img = document.createElement('img');
      img.src = w.icon;
      img.alt = '';
      img.width = 28;
      img.height = 28;
      btn.appendChild(img);
    }
    const name = document.createElement('span');
    name.textContent = w.name;
    btn.appendChild(name);

    btn.addEventListener('click', () => connect(w));
    li.appendChild(btn);
    els.wallets.appendChild(li);
  }
}

async function connect(wallet: SolanaWallet) {
  clearError();
  setStatus(`Connecting to ${wallet.name}…`);
  try {
    const { accounts } = await wallet.features['standard:connect'].connect();
    const account = accounts.find((a) => a.chains.includes(DEVNET_CHAIN)) ?? accounts[0];
    if (!account) throw new Error('Wallet returned no accounts');

    active?.offChange?.();
    const events = wallet.features['standard:events'];
    const offChange = events?.on('change', ({ accounts: next }) => {
      if (!next) return;
      if (next.length === 0) {
        teardown();
      } else if (active) {
        active.account = next[0];
        void renderConnected();
      }
    });

    active = { wallet, account, offChange };
    await renderConnected();
  } catch (err) {
    clearStatus();
    setError(err);
  }
}

async function renderConnected() {
  if (!active) return;
  els.walletList.hidden = true;
  clearStatus();
  els.connected.hidden = false;
  els.connectedName.textContent = active.wallet.name;
  els.address.textContent = active.account.address;
  els.balance.textContent = 'Loading…';
  await refreshBalance();
}

async function refreshBalance() {
  if (!active) return;
  clearError();
  els.balance.textContent = 'Loading…';
  try {
    const { value } = await rpc.getBalance(toAddress(active.account.address)).send();
    els.balance.textContent = `${formatSol(value)} SOL  (${value.toString()} lamports)`;
  } catch (err) {
    els.balance.textContent = '—';
    setError(err);
  }
}

async function disconnect() {
  if (!active) return;
  clearError();
  const w = active.wallet;
  try {
    await w.features['standard:disconnect']?.disconnect();
  } catch (err) {
    setError(err);
  } finally {
    teardown();
  }
}

function teardown() {
  active?.offChange?.();
  active = null;
  els.connected.hidden = true;
  renderWalletList();
}

els.refresh.addEventListener('click', () => void refreshBalance());
els.disconnect.addEventListener('click', () => void disconnect());

const { on } = getWallets();
on('register', () => renderWalletList());
on('unregister', () => {
  if (active && !listWallets().includes(active.wallet)) teardown();
  else renderWalletList();
});

renderWalletList();
