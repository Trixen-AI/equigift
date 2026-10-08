import { Link } from 'react-router';
import { Lockup } from '@/components/brand/Logo';

/** Shown when VITE_REOWN_PROJECT_ID is missing: wallet sign-in cannot start without it. */
export function SetupNotice() {
  return (
    <div className="setup">
      <div className="setup-card">
        <Lockup />
        <span className="ds-label page-label">Setup needed</span>
        <h1>Add your Reown project ID</h1>
        <p>
          The dashboard signs people in with Reown AppKit (email, X or any Solana wallet). Create a project at
          dashboard.reown.com, then put its ID in a <code>.env</code> file next to <code>.env.example</code>:
        </p>
        <pre>VITE_REOWN_PROJECT_ID=your_project_id</pre>
        <p>Restart the dev server after saving the file.</p>
        <Link className="btn btn-sec" to="/">Back to the site</Link>
      </div>
    </div>
  );
}
