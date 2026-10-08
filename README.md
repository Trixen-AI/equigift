# Equigift

A stock, wrapped as a gift. Delivered as a link. Choose Apple, Nvidia, Tesla or the S&P 500, set an amount
and share. Recipients claim with an email or X account. No wallet, no app. Built on Solana.

## Run

```
npm install
cp .env.example .env   # then set VITE_REOWN_PROJECT_ID (dashboard.reown.com)
npm run dev            # site at /, dashboard at /app
npm run build          # type-check + production build
npm run lint
```

`VITE_SOLANA_RPC_URL` is optional. Without it the app uses PublicNode's free endpoint (the official
`api.mainnet-beta.solana.com` rejects browser requests). Use a dedicated RPC for real traffic.

## Deploy on Vercel (equigift.xyz)

`vercel.json` already sets the build (`npm run build` → `dist`), the SPA rewrites for `/app/*` and `/claim`,
long-term caching for hashed assets, security headers, `noindex` for the dashboard, and a
`www.equigift.xyz` → `equigift.xyz` redirect.

1. Import `Trixen-AI/equigift` in Vercel (framework: Vite, detected automatically).
2. Project → Settings → Environment Variables (Production, Preview, Development):

   | Name | Required | Value |
   |---|---|---|
   | `VITE_REOWN_PROJECT_ID` | yes | Project ID from dashboard.reown.com |
   | `VITE_SOLANA_RPC_URL` | recommended | Your mainnet RPC (Helius, QuickNode, Triton…). Without it: PublicNode, rate limited |

   `VITE_` variables are baked in at build time: redeploy after changing them.
3. Settings → Domains: add `equigift.xyz` and `www.equigift.xyz`, then set the DNS records Vercel shows
   at your registrar.
4. In the Reown dashboard, add `https://equigift.xyz` (and your Vercel preview domain if you test there)
   to the project's allowed domains, otherwise sign-in is blocked.
5. If the RPC provider supports an origin allowlist, add `https://equigift.xyz` there too.

## How gifting works (all real, on Solana mainnet)

- **Stocks:** Backed Finance xStocks (AAPLx, NVDAx, TSLAx, SPYx), Token-2022 mints in `src/app/lib/config.ts`.
- **Send** (`/app/send`): pay with USDC or SOL (swapped through Jupiter) or shares you already hold. The browser
  generates a one-time gift key; the sender's wallet moves the shares plus a small SOL buffer to that address.
- **Link:** `/claim#<payload>`. The gift key lives in the URL fragment, which is never sent to a server.
  Anyone with the link can open the gift, so it is shared privately.
- **Claim** (`/app/claim`): the recipient signs in with email or X (Reown AppKit embedded wallet) or any wallet.
  The gift key signs the transfer and pays every fee, so the recipient needs nothing.
- **Gift tracker** (`/app/gifts`): live status from chain, re-share, take back an unopened gift, backup/restore.
  Gift keys are stored in this browser (`localStorage`); the backup file contains them, keep it private.
- **Portfolio** (`/app/portfolio`): balances, live prices, gift from holdings, cash out to USDC via Jupiter.

## Where things live

- `src/data/site.ts`: all site copy. `SOCIALS`: the X profile. `APP_URL`: where Launch App points (`/app`).
- `src/app/`: the dashboard (pages, wallet + Solana + Jupiter libs, styles). Lazy-loaded at `/app`.
- `src/styles/tokens.css`: palette, type scale, radii, motion tokens (shared by site and dashboard).
- `scripts/build-logo.mjs`: builds the logo (mark + outlined Geist wordmark) and exports
  `public/brand/logo.svg`, `logo-dark.svg`, `logo-500.png`, `logo-500-transparent.png` and `public/favicon.svg`.
- Third-party logos: `src/assets/logos/` and `src/assets/social/`, each with a `SOURCES.md`.

Equigift is not affiliated with Apple, NVIDIA, Tesla, S&P Dow Jones Indices, Backed Finance or the Solana Foundation.
