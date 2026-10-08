import { useMemo, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { PublicKey } from '@solana/web3.js';
import { useQuery } from '@tanstack/react-query';
import { Check, Loader2 } from 'lucide-react';
import { usePrices, useRefreshChain, useWallet } from '../hooks/data';
import { decodeGiftLink } from '../lib/giftLink';
import { giftStore, useGiftStore } from '../lib/giftStore';
import { readGifts, sweepGift } from '../lib/solana';
import { STOCK_BY_MINT, explorerTx } from '../lib/config';
import { errorText, rawToShares, shortAddr } from '../lib/format';
import { GiftCard, Notice, PageHead } from '../components/Common';
import { ConnectButton } from '../components/ConnectButton';

export default function Claim() {
  const { hash } = useLocation();
  const gift = useMemo(() => (hash.length > 1 ? decodeGiftLink(hash) : null), [hash]);
  if (hash.length <= 1) return <PasteLink />;
  if (!gift) {
    return (
      <>
        <PageHead label="Claim a gift" title="This link does not open a gift" />
        <Notice tone="error">The link looks incomplete. Ask the sender to copy it again, all the way to the end.</Notice>
        <PasteLink compact />
      </>
    );
  }
  return <GiftToClaim key={gift.keypair.publicKey.toBase58()} gift={gift} />;
}

function PasteLink({ compact = false }: { compact?: boolean }) {
  const navigate = useNavigate();
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const at = value.indexOf('#');
    if (at < 0 || !decodeGiftLink(value)) {
      setError('That is not an Equigift link.');
      return;
    }
    navigate(`/app/claim${value.slice(at)}`);
  };
  return (
    <>
      {compact ? null : <PageHead label="Claim a gift" title="Got a gift link?" />}
      <form className="card paste" onSubmit={submit}>
        <label className="field">
          <span className="field-label">Paste the link you received</span>
          <input value={value} onChange={(e) => { setValue(e.target.value); setError(''); }} placeholder="https://…/claim#…" spellCheck={false} />
        </label>
        {error ? <Notice tone="error">{error}</Notice> : null}
        <button className="btn btn-pri" type="submit">Open the gift</button>
        <p className="paste-note">Links open straight to this page too. You can sign in with email or X, no wallet or app needed.</p>
      </form>
    </>
  );
}

function GiftToClaim({ gift }: { gift: NonNullable<ReturnType<typeof decodeGiftLink>> }) {
  const { address } = useWallet();
  const prices = usePrices();
  const refresh = useRefreshChain();
  const store = useGiftStore();
  const giftAddress = gift.keypair.publicKey.toBase58();
  const stock = STOCK_BY_MINT.get(gift.payload.m);
  const state = useQuery({
    queryKey: ['gift', giftAddress],
    queryFn: () => readGifts([{ address: giftAddress, mint: gift.payload.m }]).then((m) => m.get(giftAddress)!),
    enabled: !!stock,
    refetchInterval: 20_000,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sig, setSig] = useState('');

  if (!stock) {
    return (
      <>
        <PageHead label="Claim a gift" title="Unsupported gift" />
        <Notice tone="error">This link holds a token Equigift does not support.</Notice>
      </>
    );
  }

  const price = prices.data?.[stock.mint];
  const raw = state.data?.raw ?? 0n;
  const sharesAmount = rawToShares(raw, stock.decimals, price?.multiplier);
  const openedHere = store.opened.find((g) => g.address === giftAddress);
  const isOwnGift = store.sent.some((g) => g.address === giftAddress && g.sender === address);
  const empty = state.isSuccess && (!state.data.ataExists || raw === 0n);

  async function claim() {
    if (!address || !stock) return;
    setBusy(true);
    setError('');
    try {
      const s = await sweepGift({ gift: gift.keypair, mint: stock.mint, decimals: stock.decimals, to: new PublicKey(address) });
      giftStore.addOpened({
        address: giftAddress,
        recipient: address,
        mint: stock.mint,
        symbol: stock.symbol,
        shares: sharesAmount,
        note: gift.payload.n ?? '',
        from: gift.payload.f ?? '',
        openedAt: Date.now(),
        sig: s,
      });
      setSig(s);
      refresh();
      state.refetch();
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }

  const card = (
    <GiftCard
      stock={stock}
      sharesAmount={sig || empty ? (openedHere?.shares ?? sharesAmount) : sharesAmount}
      usdValue={(sig || empty ? (openedHere?.shares ?? sharesAmount) : sharesAmount) * (price?.usd ?? 0)}
      note={gift.payload.n ?? ''}
      from={gift.payload.f}
      occasion={gift.payload.o}
    />
  );

  return (
    <>
      <PageHead label="Claim a gift" title={sig ? 'It is yours.' : gift.payload.f ? `${gift.payload.f} sent you a stock` : 'Someone sent you a stock'} />
      <div className="claim">
        <div className="claim-card">{state.isLoading ? <div className="giftcard giftcard--loading" aria-busy="true" /> : card}</div>
        <div className="card claim-side">
          {sig ? (
            <>
              <div className="claim-done"><Check size={22} /></div>
              <h2>The shares are in your wallet</h2>
              <p>You now own {stock.name} stock as {stock.symbol} on Solana. Keep it, gift it on, or cash out whenever you like.</p>
              <div className="claim-actions">
                <Link className="btn btn-pri" to="/app/portfolio">See my portfolio</Link>
                <a className="btn btn-sec" href={explorerTx(sig)} target="_blank" rel="noopener noreferrer">View on Solscan</a>
              </div>
            </>
          ) : state.isError ? (
            <>
              <h2>Could not reach Solana</h2>
              <p>We could not read this gift from the network just now. Nothing has moved; try again in a moment.</p>
              <Notice tone="error">{errorText(state.error)}</Notice>
              <button className="btn btn-pri" onClick={() => state.refetch()} disabled={state.isFetching}>{state.isFetching ? 'Checking…' : 'Try again'}</button>
            </>
          ) : empty ? (
            <>
              <h2>{openedHere ? 'You already opened this gift' : 'This gift has been opened'}</h2>
              <p>{openedHere ? 'The shares are in your portfolio.' : 'Someone already claimed it, or the sender took it back. Each link opens once.'}</p>
              <div className="claim-actions">
                <Link className="btn btn-pri" to={openedHere ? '/app/portfolio' : '/app/send'}>{openedHere ? 'See my portfolio' : 'Send a gift yourself'}</Link>
              </div>
            </>
          ) : !address ? (
            <>
              <h2>Sign in to claim</h2>
              <p>Use your email or X account. We set up a Solana wallet for you in the background, so there is nothing to install and nothing to pay.</p>
              <ConnectButton label="Claim with email or X" className="btn-block" />
              <span className="claim-or">Already have a Solana wallet? The same button connects it.</span>
            </>
          ) : (
            <>
              <h2>Ready to open</h2>
              <p>The shares go to <b>{shortAddr(address)}</b>. The gift covers every network fee, and the small amount of SOL wrapped with it comes to you as well.</p>
              {isOwnGift ? <Notice tone="info">This is a gift you sent. Opening it brings the shares back to you, the same as taking it back.</Notice> : null}
              {error ? <Notice tone="error">{error}</Notice> : null}
              <button className="btn btn-pri btn-block" onClick={claim} disabled={busy || !state.isSuccess}>
                {busy ? <Loader2 className="spin" size={16} /> : null}
                {busy ? 'Opening your gift…' : 'Claim my shares'}
              </button>
              <ConnectButton className="claim-switch" />
            </>
          )}
        </div>
      </div>
    </>
  );
}
