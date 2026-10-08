import { Suspense, lazy } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router';
import App from './App';

// The dashboard (wallet SDK, Solana libraries) only loads when someone opens /app.
const Dashboard = lazy(() => import('./app/Dashboard'));

/** Short gift links (/claim#…) open the claim page, keeping the fragment. */
function ClaimRedirect() {
  const { hash } = useLocation();
  return <Navigate to={{ pathname: '/app/claim', hash }} replace />;
}

export function Root() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/claim" element={<ClaimRedirect />} />
        <Route
          path="/app/*"
          element={
            <Suspense fallback={<div className="dash-boot" aria-busy="true" />}>
              <Dashboard />
            </Suspense>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
