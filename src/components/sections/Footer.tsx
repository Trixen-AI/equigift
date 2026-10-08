import { useState, type FormEvent } from 'react';
import { Lockup, Wordmark } from '@/components/brand/Logo';
import { SocialIcon } from '@/components/brand/SocialIcon';
import { FOOTER, SOCIALS } from '@/data/site';

// footer labels that open the dashboard or a page section
const LINKS: Record<string, string> = {
  'Send a gift': '/app/send',
  'Claim a gift': '/app/claim',
  'Equigift Pools': '/app',
  'Stock gifts': '/app/send',
  'Index gifts': '/app/send?stock=SPYx',
  'Gift tracker': '/app/gifts',
  'Help center': '#faq',
  'Gift guides': '#guides',
  Pricing: '#pricing',
  Changelog: '#guides',
  FAQ: '#faq',
};

export function Footer() {
  const [msg, setMsg] = useState('');
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const email = new FormData(e.currentTarget).get('email');
    setMsg(typeof email === 'string' && /.+@.+\..+/.test(email) ? 'Thanks. We will be in touch.' : 'Please enter a valid email.');
  };
  return (
    <footer className="footer">
      <div className="footer-dots" />
      <div className="footer-inner">
        <div className="footer-top">
          <div className="footer-brand">
            <div className="lock"><Lockup dark /></div>
            <p>{FOOTER.blurb}</p>
            <form className="footer-news" onSubmit={submit}>
              <label className="footer-news-label" htmlFor="news-email">{FOOTER.newsLabel}</label>
              <div className="footer-news-form">
                <input id="news-email" name="email" type="email" autoComplete="email" className="footer-news-input" placeholder={FOOTER.newsPlaceholder} />
                <button className="btn btn-pri footer-news-btn" type="submit">{FOOTER.newsCta}</button>
              </div>
              {msg && <p className="footer-news-msg" role="status">{msg}</p>}
            </form>
          </div>
          {FOOTER.cols.map((c) => (
            <div className="footer-col" key={c.h}>
              <h4>{c.h}</h4>
              {c.groups.map((g, gi) => (
                <div key={gi}>
                  {'cat' in g && g.cat && <div className="footer-cat">{g.cat}</div>}
                  <ul>
                    {g.links.map((l) => (
                      <li key={l}>
                        <a href={LINKS[l] ?? '#top'} className={'strong' in g && g.strong ? 'strong' : undefined}>
                          {l}
                          {l === 'Equigift Pools' && <sup className="tm">™</sup>}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ))}
          <div className="footer-col">
            <h4>Connect</h4>
            <div className="socials">
              {SOCIALS.map((s) => (
                <a key={s.key} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label}>
                  <SocialIcon name={s.key} />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <div className="footer-bottom-left">
          <span className="copy">{FOOTER.copy}</span>
        </div>
        <nav className="footer-legal" aria-label="Legal">
          {FOOTER.legal.map((l) => (
            <a key={l} href="#top">{l}</a>
          ))}
        </nav>
      </div>
      <div className="footer-wordmark" aria-hidden="true">
        <Wordmark />
      </div>
    </footer>
  );
}
