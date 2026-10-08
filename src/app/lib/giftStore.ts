import { useSyncExternalStore } from 'react';

// Local registry of gifts this browser created or opened. Sent gifts keep their
// gift key so the sender can share the link again or take the gift back.
// Versioned key so the schema can change without breaking old data.

export type SentGift = {
  address: string;
  secret: string;
  link: string;
  sender: string;
  mint: string;
  symbol: string;
  raw: string;
  shares: number;
  usdAtSend: number;
  note: string;
  occasion: string;
  createdAt: number;
  fundSig: string;
  /** set when this browser took the gift back */
  reclaimSig?: string;
};

export type OpenedGift = {
  address: string;
  recipient: string;
  mint: string;
  symbol: string;
  shares: number;
  note: string;
  from: string;
  openedAt: number;
  sig: string;
};

type Store = { v: 1; sent: SentGift[]; opened: OpenedGift[] };

const KEY = 'equigift:gifts:v1';
const EMPTY: Store = { v: 1, sent: [], opened: [] };
const listeners = new Set<() => void>();
let cache: Store | null = null;

function read(): Store {
  if (cache) return cache;
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || 'null') as Store | null;
    cache = parsed?.v === 1 ? parsed : EMPTY;
  } catch {
    cache = EMPTY;
  }
  return cache;
}

function write(next: Store) {
  cache = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage full or blocked: keep the in-memory copy for this session */
  }
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = null;
      l();
    }
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(l);
    window.removeEventListener('storage', onStorage);
  };
}

export const useGiftStore = () => useSyncExternalStore(subscribe, read, () => EMPTY);

export const giftStore = {
  addSent(g: SentGift) {
    const s = read();
    write({ ...s, sent: [g, ...s.sent.filter((x) => x.address !== g.address)] });
  },
  updateSent(address: string, patch: Partial<SentGift>) {
    const s = read();
    write({ ...s, sent: s.sent.map((g) => (g.address === address ? { ...g, ...patch } : g)) });
  },
  removeSent(address: string) {
    const s = read();
    write({ ...s, sent: s.sent.filter((g) => g.address !== address) });
  },
  markReclaimed(address: string, sig: string) {
    const s = read();
    write({ ...s, sent: s.sent.map((g) => (g.address === address ? { ...g, reclaimSig: sig } : g)) });
  },
  addOpened(g: OpenedGift) {
    const s = read();
    write({ ...s, opened: [g, ...s.opened.filter((x) => x.address !== g.address)] });
  },
  /** Backup file: includes gift keys, so it must be kept private. */
  exportJson: () => JSON.stringify(read(), null, 2),
  importJson(text: string) {
    const incoming = JSON.parse(text) as Store;
    if (incoming?.v !== 1 || !Array.isArray(incoming.sent)) throw new Error('Not an Equigift backup file');
    const s = read();
    const sent = new Map(s.sent.map((g) => [g.address, g]));
    incoming.sent.forEach((g) => sent.set(g.address, { ...sent.get(g.address), ...g }));
    const opened = new Map(s.opened.map((g) => [g.address, g]));
    (incoming.opened ?? []).forEach((g) => opened.set(g.address, g));
    write({ v: 1, sent: [...sent.values()].sort((a, b) => b.createdAt - a.createdAt), opened: [...opened.values()] });
    return incoming.sent.length;
  },
};
