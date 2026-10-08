// @solana/web3.js and @solana/spl-token expect Node's Buffer in the browser.
// Imported first by the dashboard entry so it runs before those modules load.
import { Buffer } from 'buffer';

const g = globalThis as unknown as { Buffer?: typeof Buffer };
if (!g.Buffer) g.Buffer = Buffer;
