import { RibbonScene } from '@/components/scenes/RibbonScene';
import { APP_URL, POOLS } from '@/data/site';

export function Pools() {
  return (
    <section className="pools" id="pools">
      <div className="wrap">
        <div className="panel pools-panel">
          <RibbonScene variant="panel" pixel={4} className="pools-art" />
          <div className="pools-inner">
            <span className="ds-label pools-label">{POOLS.label}</span>
            <h2 className="pools-h2">
              {POOLS.titleA}
              <br />
              <span className="hl">{POOLS.titleB}</span>
            </h2>
            <p className="pools-desc">
              <span className="bt-name">{POOLS.name}</span>
              <sup className="tm">™</sup> {POOLS.body}
            </p>
            <div className="pools-cta">
              <a className="btn btn-pri" href={APP_URL}>{POOLS.cta}</a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
