import { Keypair } from '@solana/web3.js';

// A gift link is `${origin}/claim#<payload>`. The payload lives in the URL fragment,
// which browsers never send to a server: whoever holds the link holds the gift key.

export type GiftPayload = {
  v: 1;
  /** gift secret key (64 bytes), base64url */
  k: string;
  /** stock mint */
  m: string;
  /** note from the sender */
  n?: string;
  /** occasion key */
  o?: string;
  /** sender's display name */
  f?: string;
};

const toB64Url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const fromB64Url = (s: string) => {
  const b = atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4));
  return Uint8Array.from(b, (c) => c.charCodeAt(0));
};

export const secretToString = (kp: Keypair) => toB64Url(kp.secretKey);
export const keypairFromString = (s: string) => Keypair.fromSecretKey(fromB64Url(s));

export function encodeGiftLink(origin: string, p: Omit<GiftPayload, 'v'>) {
  const json = JSON.stringify({ v: 1, ...p });
  return `${origin}/claim#${toB64Url(new TextEncoder().encode(json))}`;
}

/** Accepts a full link or just the fragment. Returns null for anything that is not a gift. */
export function decodeGiftLink(input: string): { payload: GiftPayload; keypair: Keypair } | null {
  try {
    const hash = input.includes('#') ? input.slice(input.indexOf('#') + 1) : input.trim();
    if (!hash) return null;
    const payload = JSON.parse(new TextDecoder().decode(fromB64Url(hash))) as GiftPayload;
    if (payload.v !== 1 || !payload.k || !payload.m) return null;
    return { payload, keypair: keypairFromString(payload.k) };
  } catch {
    return null;
  }
}
