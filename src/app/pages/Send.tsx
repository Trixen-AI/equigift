import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { Keypair, PublicKey } from '@solana/web3.js';
import { Check, Loader2 } from 'lucide-react';
import { useHoldings, usePrices, useRefreshChain, useWallet } from '../hooks/data';
import { MAX_NOTE, MIN_GIFT_USD, SOL, SOL_RESERVE_LAMPORTS, STOCKS, STOCK_BY_SYMBOL, USDC, type Stock } from '../lib/config';
import { fetchQuote, fetchSwapTransaction, type Quote } from '../lib/jupiter';
import { buildFundGiftTx, fetchHoldings, sendWithWallet } from '../lib/solana';
import { encodeGiftLink, secretToString } from '../lib/giftLink';
import { giftStore } from '../lib/giftStore';
import { errorText, rawToShares, sharesToRaw, shares as fmtShares, sol as fmtSol, toBaseUnits, usd } from '../lib/format';
import { ConnectGate, GiftCard, Notice, PageHead, StockBadge } from '../components/Common';
import { SharePanel } from '../components/SharePanel';
import { OCCASIONS } from '@/data/site';

type PayWith = 'USDC' | 'SOL' | 'HOLDING';
type Phase = 'idle' | 'swap' | 'wrap' | 'done';
type QuoteState = { key: string; quote: Quote | null; error: string };

const PRESETS = [5, 10, 25, 50, 100];
// gift account rent + its fee buffer (refunded to the recipient on claim)
const GIFT_COST_LAMPORTS = 6_500_000;

export default function Send() {
  const [params] = useSearchParams();
  const { address, provider } = useWallet();
  const prices = usePrices();
  const holdings = useHoldings(address);
  const refresh = useRefreshChain();

  const [symbol, setSymbol] = useState<Stock['symbol']>(() => (STOCK_BY_SYMBOL.has(params.get('stock') as Stock['symbol']) ? (params.get('stock') as Stock['symbol']) : 'AAPLx'));
  const [amount, setAmount] = useState('25');
  const [payWith, setPayWith] = useState<PayWith>(() => (params.get('pay') === 'holding' ? 'HOLDING' : 'USDC'));
  const [occasion, setOccasion] = useState('birthday');
  const [note, setNote] = useState('');
  const [from, setFrom] = useState('');
  const [phase, setPhase] = useState<Phase>('idle');
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ link: string; sharesAmount: number; usdValue: number } | null>(null);
  const [quoteState, setQuoteState] = useState<QuoteState>({ key: '', quote: null, error: '' });

  const stock = STOCK_BY_SYMBOL.get(symbol)!;
  const price = prices.data?.[stock.mint];
  const solPrice = prices.data?.[SOL.mint]?.usd;
  const usdNum = Number(amount);
  const validAmount = Number.isFinite(usdNum) && usdNum >= MIN_GIFT_USD;
  const targetShares = price && validAmount ? usdNum / price.usd : 0;

  // what the swap spends, in base units of the pay token
  const inputMint = payWith === 'SOL' ? SOL.mint : USDC.mint;
  const inputBase =
    payWith === 'USDC' && validAmount ? toBaseUnits(usdNum, USDC.decimals) : payWith === 'SOL' && validAmount && solPrice ? toBaseUnits(usdNum / solPrice, SOL.decimals) : 0n;
  const quoteKey = payWith === 'HOLDING' ? '' : `${inputMint}:${stock.mint}:${inputBase}`;
  const quote = quoteState.key === quoteKey ? quoteState.quote : null;
  const quoteError = quoteState.key === quoteKey ? quoteState.error : '';
  const quoting = quoteKey !== '' && inputBase > 0n && quoteState.key !== quoteKey;

  // live quote, debounced; results are tagged with the inputs they belong to
  useEffect(() => {
    if (!quoteKey || inputBase <= 0n) return;
    const ac = new AbortController();
    const t = setTimeout(() => {
      fetchQuote({ inputMint, outputMint: stock.mint, amount: inputBase }, ac.signal)
        .then((q) => setQuoteState({ key: quoteKey, quote: q, error: '' }))
        .catch((e) => !ac.signal.aborted && setQuoteState({ key: quoteKey, quote: null, error: errorText(e) }));
    }, 450);
    return () => {
      clearTimeout(t);
      ac.abort();
    };
  }, [quoteKey, inputBase, inputMint, stock.mint]);

  const h = holdings.data;
  const lamports = h?.lamports ?? 0;
  const usdcBal = h?.tokens.get(USDC.mint)?.ui ?? 0;
  const stockHolding = h?.tokens.get(stock.mint);
  const holdingShares = stockHolding?.ui ?? 0;
  const holdingRaw = price && validAmount ? sharesToRaw(targetShares, stock.decimals, price.multiplier) : 0n;

  const previewShares = payWith === 'HOLDING' ? targetShares : quote ? rawToShares(quote.outAmount, stock.decimals, price?.multiplier) : targetShares;

  let blocker = '';
  if (!validAmount) blocker = `Gifts start at ${usd(MIN_GIFT_USD)}.`;
  else if (!price) blocker = 'Waiting for the live price…';
  else if (lamports < GIFT_COST_LAMPORTS + (payWith === 'SOL' ? Number(inputBase) + SOL_RESERVE_LAMPORTS : 20_000))
    blocker = `You need about ${((GIFT_COST_LAMPORTS + (payWith === 'SOL' ? Number(inputBase) + SOL_RESERVE_LAMPORTS : 20_000)) / 1e9).toFixed(4)} SOL for this gift and its network fees.`;
  else if (payWith === 'USDC' && usdcBal < usdNum) blocker = `Your wallet has ${usd(usdcBal)} USDC.`;
  else if (payWith === 'HOLDING' && (stockHolding?.raw ?? 0n) < holdingRaw) blocker = `You hold ${fmtShares(holdingShares)} ${stock.symbol}.`;
  else if (payWith !== 'HOLDING' && !quote) blocker = quoteError || 'Finding the best price…';

  async function create() {
    if (!address || !provider || blocker) return;
    setError('');
    const sender = new PublicKey(address);
    let gift: Keypair | null = null;
    try {
      let raw = holdingRaw;
      if (payWith !== 'HOLDING') {
        setPhase('swap');
        const before = (await fetchHoldings(address)).tokens.get(stock.mint)?.raw ?? 0n;
        const fresh = await fetchQuote({ inputMint, outputMint: stock.mint, amount: inputBase });
        const { tx } = await fetchSwapTransaction(fresh, address);
        await sendWithWallet(provider, tx);
        const after = (await fetchHoldings(address)).tokens.get(stock.mint)?.raw ?? 0n;
        raw = after - before;
        if (raw <= 0n) throw new Error('The swap confirmed but no shares arrived yet. They will show in your portfolio shortly; send them with "My shares".');
      }

      setPhase('wrap');
      gift = Keypair.generate();
      const multiplier = price?.multiplier ?? 1;
      const giftShares = rawToShares(raw, stock.decimals, multiplier);
      const link = encodeGiftLink(window.location.origin, { k: secretToString(gift), m: stock.mint, n: note.trim() || undefined, o: occasion, f: from.trim() || undefined });
      // keep the gift key before any funds move, so it can never be lost mid-flow
      giftStore.addSent({
        address: gift.publicKey.toBase58(),
        secret: secretToString(gift),
        link,
        sender: address,
        mint: stock.mint,
        symbol: stock.symbol,
        raw: raw.toString(),
        shares: giftShares,
        usdAtSend: giftShares * (price?.usd ?? 0),
        note: note.trim(),
        occasion,
        createdAt: Date.now(),
        fundSig: 'pending',
      });
      const tx = await buildFundGiftTx({ sender, gift: gift.publicKey, mint: stock.mint, raw, decimals: stock.decimals });
      const sig = await sendWithWallet(provider, tx);
      giftStore.updateSent(gift.publicKey.toBase58(), { fundSig: sig });
      setResult({ link, sharesAmount: giftShares, usdValue: giftShares * (price?.usd ?? 0) });
      setPhase('done');
      refresh();
    } catch (e) {
      if (gift) giftStore.removeSent(gift.publicKey.toBase58());
      setError(errorText(e));
      setPhase('idle');
      refresh();
    }
  }

  if (!address) {
    return (
      <>
        <PageHead label="Send a gift" title="Wrap a stock in a link" />
        <ConnectGate title="Sign in to send a gift" body="Pick a stock, set an amount and get a link anyone can open with an email or X account." />
      </>
    );
  }

  if (phase === 'done' && result) {
    return (
      <>
        <PageHead label="Gift ready" title="Your gift is wrapped" />
        <SharePanel link={result.link} stock={stock} sharesAmount={result.sharesAmount} usdValue={result.usdValue} note={note} from={from} occasion={occasion} onAnother={() => { setResult(null); setPhase('idle'); setNote(''); }} />
      </>
    );
  }

  const busy = phase === 'swap' || phase === 'wrap';

  return (
    <>
      <PageHead label="Send a gift" title="Wrap a stock in a link" />
      <div className="send-grid">
        <div className="send-form">
          <section className="card">
            <h2 className="step-title"><span>01</span>Pick a stock</h2>
            <div className="stock-pick" role="radiogroup" aria-label="Stock">
              {STOCKS.map((s) => {
                const pr = prices.data?.[s.mint];
                return (
                  <button key={s.symbol} role="radio" aria-checked={s.symbol === symbol} className={`stock-opt${s.symbol === symbol ? ' is-on' : ''}`} onClick={() => setSymbol(s.symbol)} disabled={busy}>
                    <StockBadge stock={s} size="sm" />
                    <span className="stock-opt-name">{s.name}</span>
                    <span className="stock-opt-price">{pr ? usd(pr.usd) : '…'}</span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="card">
            <h2 className="step-title"><span>02</span>Set an amount</h2>
            <label className="amount">
              <span className="amount-cur">$</span>
              <input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))} aria-label="Gift amount in US dollars" disabled={busy} />
              <span className="amount-shares">≈ {fmtShares(previewShares)} {stock.symbol}</span>
            </label>
            <div className="chips">
              {PRESETS.map((v) => (
                <button key={v} className={`chip${usdNum === v ? ' is-on' : ''}`} onClick={() => setAmount(String(v))} disabled={busy}>${v}</button>
              ))}
            </div>
            <div className="pay">
              <span className="field-label">Pay with</span>
              <div className="pay-opts">
                <PayOpt on={payWith === 'USDC'} onClick={() => setPayWith('USDC')} title="USDC" sub={`${usd(usdcBal)} available`} disabled={busy} />
                <PayOpt on={payWith === 'SOL'} onClick={() => setPayWith('SOL')} title="SOL" sub={`${fmtSol(lamports / 1e9)} SOL`} disabled={busy} />
                <PayOpt on={payWith === 'HOLDING'} onClick={() => setPayWith('HOLDING')} title={`My ${stock.symbol}`} sub={`${fmtShares(holdingShares)} shares`} disabled={busy || holdingShares === 0} />
              </div>
            </div>
            {payWith !== 'HOLDING' ? (
              <div className="quote">
                {quoting ? <span className="quote-line"><Loader2 className="spin" size={14} />Finding the best price…</span> : null}
                {quote && !quoting ? (
                  <>
                    <span className="quote-line">
                      You pay <b>{payWith === 'SOL' ? `${(Number(quote.inAmount) / 1e9).toFixed(4)} SOL` : usd(Number(quote.inAmount) / 1e6)}</b> and the gift holds about <b>{fmtShares(previewShares)} {stock.symbol}</b>
                    </span>
                    <span className="quote-meta">Route via {quote.routePlan.map((r) => r.swapInfo.label).filter(Boolean).slice(0, 2).join(' + ') || 'Jupiter'} · price impact {(Number(quote.priceImpactPct) * 100).toFixed(2)}% · max slippage 1%</span>
                  </>
                ) : null}
              </div>
            ) : null}
          </section>

          <section className="card">
            <h2 className="step-title"><span>03</span>Make it personal</h2>
            <div className="chips chips--wrap">
              {OCCASIONS.map((o) => (
                <button key={o.key} className={`chip${occasion === o.key ? ' is-on' : ''}`} onClick={() => setOccasion(o.key)} disabled={busy}>{o.name}</button>
              ))}
            </div>
            <label className="field">
              <span className="field-label">Note <em>{note.length}/{MAX_NOTE}</em></span>
              <textarea rows={3} maxLength={MAX_NOTE} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Happy birthday! Check on this one next year." disabled={busy} />
            </label>
            <label className="field">
              <span className="field-label">From</span>
              <input value={from} maxLength={40} onChange={(e) => setFrom(e.target.value)} placeholder="Your name, as the recipient knows you" disabled={busy} />
            </label>
          </section>
        </div>

        <aside className="send-side">
          <GiftCard stock={stock} sharesAmount={previewShares} usdValue={validAmount ? usdNum : 0} note={note} from={from} occasion={occasion} />
          <div className="card summary">
            <div className="sum-row"><span>Gift value</span><b>{validAmount ? usd(usdNum) : '-'}</b></div>
            <div className="sum-row"><span>Gift wrapping</span><b>≈ {(GIFT_COST_LAMPORTS / 1e9).toFixed(4)} SOL</b></div>
            <p className="sum-note">The wrapping SOL travels with the gift and lands in the recipient's wallet as starter gas. Recipients never pay to claim.</p>
            {phase !== 'idle' ? (
              <ol className="progress">
                {payWith !== 'HOLDING' ? <Progress label="Buy the shares" state={phase === 'swap' ? 'active' : 'done'} /> : null}
                <Progress label="Wrap them in a link" state={phase === 'wrap' ? 'active' : phase === 'swap' ? 'todo' : 'done'} />
              </ol>
            ) : null}
            {error ? <Notice tone="error">{error}</Notice> : null}
            {blocker && !busy ? <p className="sum-blocker">{blocker}</p> : null}
            <button className="btn btn-pri btn-block" onClick={create} disabled={!!blocker || busy}>
              {busy ? <Loader2 className="spin" size={16} /> : null}
              {busy ? 'Confirm in your wallet…' : payWith === 'HOLDING' ? 'Wrap this gift' : 'Buy and wrap this gift'}
            </button>
            <p className="sum-fine">{payWith === 'HOLDING' ? 'One signature.' : 'Two signatures: one for the purchase, one to wrap the gift.'} Shares are {stock.symbol}, tokenized {stock.name} stock on Solana.</p>
          </div>
        </aside>
      </div>
    </>
  );
}

function PayOpt({ on, onClick, title, sub, disabled }: { on: boolean; onClick: () => void; title: string; sub: string; disabled?: boolean }) {
  return (
    <button className={`pay-opt${on ? ' is-on' : ''}`} onClick={onClick} disabled={disabled} aria-pressed={on}>
      <span className="pay-title">{title}</span>
      <span className="pay-sub">{sub}</span>
    </button>
  );
}

function Progress({ label, state }: { label: string; state: 'todo' | 'active' | 'done' }) {
  return (
    <li className={`prog prog--${state}`}>
      {state === 'done' ? <Check size={14} /> : state === 'active' ? <Loader2 className="spin" size={14} /> : <span className="prog-dot" />}
      {label}
    </li>
  );
}
