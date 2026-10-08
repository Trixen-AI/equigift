import { useState } from 'react';
import { Receipt, ShieldCheck } from 'lucide-react';
import { DotRidges } from '@/components/scenes/DotRidges';
import { PRICING } from '@/data/site';

export function Pricing() {
  const [tab, setTab] = useState(0);
  return (
    <section className="token" id="pricing">
      <div className="wrap">
        <div className="panel panel--accent token-panel">
          <div className="token-bg"><DotRidges /></div>
          <div className="panel__inner">
            <div className="token-head">
              <h2>
                <b>{PRICING.titleBold}</b> {PRICING.titleRest}
              </h2>
              <p className="lead">{PRICING.body}</p>
              <div className="token-head-btns">
                <a className="btn btn-pri token-head-btn" href="#pricing"><Receipt />{PRICING.primary}</a>
                <a className="btn btn-glass token-head-btn" href="#safe"><ShieldCheck />{PRICING.secondary}</a>
              </div>
            </div>
            <div className="token-nav">
              <div className="token-tabs" role="tablist" aria-label="Pricing details">
                {PRICING.tabs.map((x, i) => (
                  <button key={x.t} role="tab" aria-selected={i === tab} className={`token-tab${i === tab ? ' active' : ''}`} onClick={() => setTab(i)}>
                    <span className="tb-idx">{String(i + 1).padStart(2, '0')}</span>
                    {x.t}
                  </button>
                ))}
              </div>
              <div className="token-body" role="tabpanel">
                <p className="token-text" key={tab}>{PRICING.tabs[tab].d}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
