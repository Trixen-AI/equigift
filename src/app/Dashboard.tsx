import './polyfills';
import './dashboard.css';
import { lazy, Suspense } from 'react';
import { Navigate, NavLink, Route, Routes, Link } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ArrowUpRight, Gift, LayoutGrid, ListChecks, PieChart, Ticket } from 'lucide-react';
import { appKitReady } from './lib/appkit';
import { Lockup } from '@/components/brand/Logo';
import { ConnectButton } from './components/ConnectButton';
import { SetupNotice } from './components/SetupNotice';

const Overview = lazy(() => import('./pages/Overview'));
const Send = lazy(() => import('./pages/Send'));
const Gifts = lazy(() => import('./pages/Gifts'));
const Portfolio = lazy(() => import('./pages/Portfolio'));
const Claim = lazy(() => import('./pages/Claim'));

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 2, refetchOnWindowFocus: true } } });

const NAV = [
  { to: '/app', label: 'Overview', icon: LayoutGrid, end: true },
  { to: '/app/send', label: 'Send a gift', icon: Gift },
  { to: '/app/gifts', label: 'Gift tracker', icon: ListChecks },
  { to: '/app/portfolio', label: 'Portfolio', icon: PieChart },
  { to: '/app/claim', label: 'Claim a gift', icon: Ticket },
];

function Shell() {
  return (
    <div className="dash">
      {/* React 19 hoists these into <head>: the dashboard and gift links stay out of search */}
      <title>Equigift App | Send and claim stock gifts</title>
      <meta name="robots" content="noindex, nofollow" />
      <aside className="dash-side">
        <Link to="/" className="dash-brand" aria-label="Equigift home">
          <Lockup />
        </Link>
        <nav className="dash-nav" aria-label="Dashboard">
          {NAV.map(({ to, label, icon: I, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => `dash-link${isActive ? ' is-active' : ''}`}>
              <I size={18} strokeWidth={1.8} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="dash-side-foot">
          <span className="dash-net"><i />Solana mainnet</span>
          <Link to="/" className="dash-back">
            Back to site <ArrowUpRight size={14} />
          </Link>
        </div>
      </aside>
      <div className="dash-main">
        <header className="dash-top">
          <Link to="/" className="dash-top-brand" aria-label="Equigift home">
            <Lockup />
          </Link>
          <span className="dash-net dash-net--top"><i />Solana</span>
          <ConnectButton />
        </header>
        <main className="dash-body">
          <Suspense fallback={<div className="dash-loading" aria-busy="true" />}>
            <Routes>
              <Route index element={<Overview />} />
              <Route path="send" element={<Send />} />
              <Route path="gifts" element={<Gifts />} />
              <Route path="portfolio" element={<Portfolio />} />
              <Route path="claim" element={<Claim />} />
              <Route path="*" element={<Navigate to="/app" replace />} />
            </Routes>
          </Suspense>
        </main>
      </div>
      <nav className="dash-tabs" aria-label="Dashboard">
        {NAV.map(({ to, label, icon: I, end }) => (
          <NavLink key={to} to={to} end={end} className={({ isActive }) => `dash-tab${isActive ? ' is-active' : ''}`}>
            <I size={19} strokeWidth={1.8} />
            <span>{label.replace(' a gift', '').replace('Gift tracker', 'Gifts')}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

export default function Dashboard() {
  if (!appKitReady) return <SetupNotice />;
  return (
    <QueryClientProvider client={queryClient}>
      <Shell />
    </QueryClientProvider>
  );
}
