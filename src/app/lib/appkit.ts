import { createAppKit } from '@reown/appkit/react';
import { SolanaAdapter } from '@reown/appkit-adapter-solana/react';
import { solana } from '@reown/appkit/networks';
import { REOWN_PROJECT_ID } from './config';

// Initialised once, at module load, outside React (as AppKit requires).
// Email and X sign-in create an embedded Solana wallet, so recipients can claim
// a gift without installing anything.
export const appKitReady = Boolean(REOWN_PROJECT_ID);

if (appKitReady) {
  createAppKit({
    adapters: [new SolanaAdapter()],
    networks: [solana],
    defaultNetwork: solana,
    projectId: REOWN_PROJECT_ID,
    metadata: {
      name: 'Equigift',
      description: 'A stock, wrapped as a gift. Delivered as a link.',
      url: window.location.origin,
      icons: [`${window.location.origin}/brand/logo-500.png`],
    },
    features: {
      email: true,
      socials: ['x', 'google', 'apple'],
      emailShowWallets: true,
      analytics: false,
      swaps: false,
      onramp: false,
    },
    themeMode: 'light',
    themeVariables: {
      '--w3m-accent': '#f98500',
      '--w3m-font-family': "'Geist Variable', -apple-system, sans-serif",
      '--w3m-border-radius-master': '2px',
    },
  });
}
