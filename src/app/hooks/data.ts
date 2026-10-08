import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAppKitAccount, useAppKitProvider } from '@reown/appkit/react';
import type { Provider } from '@reown/appkit-adapter-solana/react';
import { fetchPrices } from '../lib/jupiter';
import { fetchHoldings, readGifts } from '../lib/solana';
import { SOL, STOCKS, USDC } from '../lib/config';
import type { SentGift } from '../lib/giftStore';

const PRICE_MINTS = [...STOCKS.map((s) => s.mint), SOL.mint, USDC.mint];

/** Live USD prices for the giftable stocks, SOL and USDC. */
export function usePrices() {
  return useQuery({
    queryKey: ['prices'],
    queryFn: () => fetchPrices(PRICE_MINTS),
    refetchInterval: 30_000,
    staleTime: 20_000,
  });
}

/** The connected Solana account. The dashboard only mounts when AppKit is configured. */
export function useWallet() {
  const { address, isConnected } = useAppKitAccount({ namespace: 'solana' });
  const { walletProvider } = useAppKitProvider<Provider>('solana');
  return { address: isConnected ? address : undefined, isConnected, provider: walletProvider };
}

export function useHoldings(address: string | undefined) {
  return useQuery({
    queryKey: ['holdings', address],
    queryFn: () => fetchHoldings(address!),
    enabled: !!address,
    refetchInterval: 45_000,
  });
}

export function useGiftStates(gifts: Pick<SentGift, 'address' | 'mint'>[]) {
  const key = gifts.map((g) => g.address).join(',');
  return useQuery({
    queryKey: ['gift-states', key],
    queryFn: () => readGifts(gifts.map((g) => ({ address: g.address, mint: g.mint }))),
    enabled: gifts.length > 0,
    refetchInterval: 30_000,
  });
}

/** Call after any transaction so balances and gift statuses refresh at once. */
export function useRefreshChain() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ['holdings'] });
    qc.invalidateQueries({ queryKey: ['gift-states'] });
  };
}

export type GiftStatus = 'waiting' | 'opened' | 'returned' | 'checking';

export function statusOf(g: SentGift, states: Map<string, { raw: bigint; ataExists: boolean }> | undefined): GiftStatus {
  if (g.reclaimSig) return 'returned';
  const st = states?.get(g.address);
  if (!st) return 'checking';
  return st.ataExists && st.raw > 0n ? 'waiting' : 'opened';
}
