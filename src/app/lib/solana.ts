import { Connection, Keypair, PublicKey, SystemProgram, Transaction, type TransactionInstruction, type VersionedTransaction } from '@solana/web3.js';
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountIdempotentInstruction,
  createCloseAccountInstruction,
  createTransferCheckedInstruction,
  getAssociatedTokenAddressSync,
} from '@solana/spl-token';
import type { Provider } from '@reown/appkit-adapter-solana/react';
import { RPC_URL, STOCK_BY_MINT, USDC } from './config';

export const connection = new Connection(RPC_URL, 'confirmed');

/** xStocks live on Token-2022; USDC on the classic token program. */
const programFor = (mint: string) => (STOCK_BY_MINT.has(mint) ? TOKEN_2022_PROGRAM_ID : TOKEN_PROGRAM_ID);
export const ataOf = (mint: string, owner: PublicKey) =>
  getAssociatedTokenAddressSync(new PublicKey(mint), owner, true, programFor(mint), ASSOCIATED_TOKEN_PROGRAM_ID);

// ---------------------------------------------------------------- holdings

export type Holding = { mint: string; raw: bigint; ui: number; decimals: number };
export type Holdings = { lamports: number; tokens: Map<string, Holding> };

type ParsedAmount = { amount: string; decimals: number; uiAmountString?: string; uiAmount: number | null };

/**
 * SOL plus the wallet's balance of every token Equigift uses (the four stocks and USDC).
 * Reads the derived token accounts in one batch call, so it works on RPCs that do not
 * serve indexed lookups such as getTokenAccountsByOwner.
 */
export async function fetchHoldings(owner: string): Promise<Holdings> {
  const pk = new PublicKey(owner);
  const mints = [...STOCK_BY_MINT.keys(), USDC.mint];
  const [lamports, accounts] = await Promise.all([
    connection.getBalance(pk),
    connection.getMultipleParsedAccounts(mints.map((m) => ataOf(m, pk))),
  ]);
  const tokens = new Map<string, Holding>();
  accounts.value.forEach((acc, i) => {
    if (!acc || !('parsed' in acc.data)) return;
    const amt = (acc.data.parsed.info as { tokenAmount: ParsedAmount }).tokenAmount;
    const raw = BigInt(amt.amount);
    if (raw === 0n) return;
    tokens.set(mints[i], { mint: mints[i], raw, ui: Number(amt.uiAmountString ?? amt.uiAmount ?? 0), decimals: amt.decimals });
  });
  return { lamports, tokens };
}

// ---------------------------------------------------------------- gift state

export type GiftState = { raw: bigint; lamports: number; ataLamports: number; ataExists: boolean };

/** What is still sitting at a gift address: token balance, SOL buffer, token account rent. */
export async function readGifts(gifts: { address: string; mint: string }[]): Promise<Map<string, GiftState>> {
  const out = new Map<string, GiftState>();
  if (!gifts.length) return out;
  const owners = gifts.map((g) => new PublicKey(g.address));
  const atas = gifts.map((g, i) => ataOf(g.mint, owners[i]));
  // two batched calls cover any number of gifts (100 accounts per call)
  const chunks = <T,>(a: T[]) => Array.from({ length: Math.ceil(a.length / 100) }, (_, i) => a.slice(i * 100, i * 100 + 100));
  const [ownerInfos, ataInfos] = await Promise.all([
    Promise.all(chunks(owners).map((c) => connection.getMultipleAccountsInfo(c))).then((r) => r.flat()),
    Promise.all(chunks(atas).map((c) => connection.getMultipleParsedAccounts(c))).then((r) => r.flatMap((x) => x.value)),
  ]);
  gifts.forEach((g, i) => {
    const ata = ataInfos[i];
    let raw = 0n;
    if (ata && 'parsed' in ata.data) raw = BigInt((ata.data.parsed.info as { tokenAmount: ParsedAmount }).tokenAmount.amount);
    out.set(g.address, { raw, lamports: ownerInfos[i]?.lamports ?? 0, ataLamports: ata?.lamports ?? 0, ataExists: !!ata });
  });
  return out;
}

// ---------------------------------------------------------------- wallet sending

export async function confirm(signature: string, timeoutMs = 90_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const { value } = await connection.getSignatureStatuses([signature], { searchTransactionHistory: false });
    const st = value[0];
    if (st?.err) throw new Error('The transaction failed on-chain');
    if (st?.confirmationStatus === 'confirmed' || st?.confirmationStatus === 'finalized') return;
    await new Promise((r) => setTimeout(r, 1500));
  }
  throw new Error('Timed out waiting for confirmation. Check the explorer before retrying.');
}

/** Sign with the connected wallet (extension, mobile wallet or email / X embedded wallet) and confirm. */
export async function sendWithWallet(provider: Provider, tx: Transaction | VersionedTransaction) {
  const signature = await provider.signAndSendTransaction(tx);
  await confirm(signature);
  return signature;
}

// ---------------------------------------------------------------- gift funding

/** SOL left at the gift address so the claim pays its own fees and the recipient's token account. */
export async function giftBufferLamports() {
  // Token-2022 accounts for xStocks carry several extensions; 300 bytes is a safe upper bound.
  return (await connection.getMinimumBalanceForRentExemption(300)) + 50_000;
}

/** Sender wallet tx: open the gift's token account, move the shares in, add the fee buffer. */
export async function buildFundGiftTx(p: { sender: PublicKey; gift: PublicKey; mint: string; raw: bigint; decimals: number }) {
  const mint = new PublicKey(p.mint);
  const program = programFor(p.mint);
  const giftAta = ataOf(p.mint, p.gift);
  const ixs: TransactionInstruction[] = [
    createAssociatedTokenAccountIdempotentInstruction(p.sender, giftAta, p.gift, mint, program, ASSOCIATED_TOKEN_PROGRAM_ID),
    createTransferCheckedInstruction(ataOf(p.mint, p.sender), mint, giftAta, p.sender, p.raw, p.decimals, [], program),
    SystemProgram.transfer({ fromPubkey: p.sender, toPubkey: p.gift, lamports: await giftBufferLamports() }),
  ];
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
  const tx = new Transaction({ feePayer: p.sender, blockhash, lastValidBlockHeight }).add(...ixs);
  return tx;
}

// ---------------------------------------------------------------- claim / take back

/**
 * Moves everything at a gift address to `to`: all shares, the gift token account's
 * rent and the leftover SOL. Signed by the gift key itself, so the recipient needs
 * no SOL and no signature. The gift address ends at exactly zero lamports.
 */
export async function sweepGift(p: { gift: Keypair; mint: string; decimals: number; to: PublicKey }) {
  const mint = new PublicKey(p.mint);
  const program = programFor(p.mint);
  const giftAta = ataOf(p.mint, p.gift.publicKey);
  const toAta = ataOf(p.mint, p.to);
  const [state, toAtaInfo] = await Promise.all([
    readGifts([{ address: p.gift.publicKey.toBase58(), mint: p.mint }]).then((m) => m.get(p.gift.publicKey.toBase58())!),
    connection.getAccountInfo(toAta),
  ]);
  if (!state.ataExists || state.raw === 0n) throw new Error('This gift has already been opened.');
  // the gift's own token account was created by the same program for the same mint,
  // so its rent is exactly what a new account for the recipient costs
  const newAccountRent = toAtaInfo ? 0 : state.ataLamports;

  const build = (sweepLamports: number, blockhash: string, lastValidBlockHeight: number) => {
    const tx = new Transaction({ feePayer: p.gift.publicKey, blockhash, lastValidBlockHeight });
    if (!toAtaInfo) tx.add(createAssociatedTokenAccountIdempotentInstruction(p.gift.publicKey, toAta, p.to, mint, program, ASSOCIATED_TOKEN_PROGRAM_ID));
    tx.add(
      createTransferCheckedInstruction(giftAta, mint, toAta, p.gift.publicKey, state.raw, p.decimals, [], program),
      createCloseAccountInstruction(giftAta, p.to, p.gift.publicKey, [], program),
    );
    if (sweepLamports > 0) tx.add(SystemProgram.transfer({ fromPubkey: p.gift.publicKey, toPubkey: p.to, lamports: sweepLamports }));
    return tx;
  };

  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
  const fee = (await connection.getFeeForMessage(build(1, blockhash, lastValidBlockHeight).compileMessage(), 'confirmed')).value ?? 5000;
  const sweep = state.lamports - fee - newAccountRent;
  if (sweep < 0) throw new Error('This gift is missing its fee buffer, so it cannot pay for the claim.');
  const tx = build(sweep, blockhash, lastValidBlockHeight);
  tx.sign(p.gift);
  const signature = await connection.sendRawTransaction(tx.serialize(), { preflightCommitment: 'confirmed' });
  await confirm(signature);
  return signature;
}
