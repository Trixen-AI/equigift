import { RotatingWord } from '@/components/ui/RotatingWord';
import { BrandLogo, type BrandKey } from '@/components/brand/BrandLogos';
import { HERO } from '@/data/site';

// solanaLogo.svg is the white (dark background) logotype, so the light band uses the official logomark
const BAND: BrandKey[] = ['apple', 'nvidia', 'tesla', 'sp500', 'solanaMark'];

export function Hero() {
  return (
    <header className="hero" id="top">
      <div className="wrap">
        <div className="panel panel--accent hero-panel">
          <div className="panel__dots" />
          <div className="panel__glow" />
          <div className="panel__inner">
            <a className="hero-news" href={HERO.news.href}>
              <span className="hn-live"><i />{HERO.news.tag}</span>
              <span className="hn-text">{HERO.news.text}</span>
              <i className="arr">›</i>
            </a>
            <span className="ds-label hero-eyebrow">
              {HERO.eyebrowLead} <RotatingWord words={HERO.eyebrowWords} /> {HERO.eyebrowTail}
            </span>
            <h1>
              {HERO.titleA}<br /><span className="hl">{HERO.titleB}</span>
            </h1>
            <p className="sub">{HERO.sub}</p>
            <div className="hero-cta">
              <a className="btn btn-pri" href={HERO.primary.href}>{HERO.primary.label}</a>
              <a className="btn btn-glass" href={HERO.secondary.href}>{HERO.secondary.label}</a>
            </div>
          </div>
        </div>
      </div>
      <div className="trusted">
        <div className="cap">{HERO.band}</div>
        <div className="marquee">
          <div className="marquee-track">
            {[...BAND, ...BAND].map((b, i) => (
              <div className="logo-cell" key={i} aria-hidden={i >= BAND.length}>
                <BrandLogo name={b} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
