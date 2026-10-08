import { GUIDES } from '@/data/site';

// Original line drawing for the "First Share" cover: an open gift box with a
// growth line sprouting out of it like a seedling. Ink strokes, hatched sides.
function FirstShareArt() {
  const hatch = Array.from({ length: 16 }, (_, i) => i);
  return (
    <svg className="paper-art" viewBox="0 0 300 300" aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
        {/* box: front and right faces */}
        <path d="M40 170 L150 200 L150 290 L40 260 Z" strokeWidth="2.2" />
        <path d="M150 200 L250 172 L250 262 L150 290 Z" strokeWidth="2.2" />
        {hatch.map((i) => (
          <path key={i} d={`M${156 + i * 6} ${198 - i * 1.7} L${156 + i * 6} ${288 - i * 1.7}`} strokeWidth="0.9" opacity="0.7" />
        ))}
        {/* ribbon down the front */}
        <path d="M88 183 L88 273 M102 187 L102 277" strokeWidth="1.6" />
        <path d="M200 186 L200 276 M213 182 L213 272" strokeWidth="1.6" />
        {/* lid, lifted and tilted */}
        <path d="M22 132 L136 96 L262 128 L150 168 Z" strokeWidth="2.2" />
        <path d="M22 132 L22 148 L150 186 L150 168" strokeWidth="2" />
        <path d="M150 186 L262 146 L262 128" strokeWidth="2" />
        <path d="M78 114 L206 150 M108 105 L234 141" strokeWidth="1.4" opacity="0.85" />
        {/* bow on the lid */}
        <path d="M150 126 C128 104 102 110 110 124 C116 134 138 132 150 126 Z" strokeWidth="1.8" />
        <path d="M150 126 C170 102 198 108 190 122 C184 133 162 131 150 126 Z" strokeWidth="1.8" />
        <path d="M146 129 L136 150 M154 129 L166 149" strokeWidth="1.8" />
        {/* growth line rising out of the box like a sprout */}
        <path d="M150 172 L150 150 M150 150 L118 118 L140 92 L120 60 L156 30 L176 46 L214 8" strokeWidth="2.4" />
        <path d="M206 6 L216 7 L215 17" strokeWidth="2.4" />
        <path d="M118 118 C100 112 92 98 96 86 C110 90 120 102 118 118 Z" strokeWidth="1.5" />
        <path d="M140 92 C156 84 170 88 176 100 C162 106 148 102 140 92 Z" strokeWidth="1.5" />
        <path d="M120 60 C104 52 100 38 104 28 C118 34 124 46 120 60 Z" strokeWidth="1.5" />
        {/* sparkle marks */}
        <path d="M60 60 L60 76 M52 68 L68 68 M248 70 L248 82 M242 76 L254 76 M236 26 L236 34 M232 30 L240 30" strokeWidth="1.4" opacity="0.9" />
      </g>
    </svg>
  );
}

export function Guides() {
  return (
    <section className="research" id="guides">
      <div className="wrap">
        <div className="rr-head">
          <span className="ds-label">{GUIDES.label}</span>
          <h2>{GUIDES.title}</h2>
          <p className="lead">{GUIDES.body}</p>
        </div>
        <div className="rr-grid">
          {GUIDES.items.map((g) => (
            <a className="paper" href="#guides" key={g.name}>
              <div className="paper-cover">
                <div className="dots" />
                {g.kind === 'art' ? (
                  <>
                    <FirstShareArt />
                    <div className="paper-name">{g.name}</div>
                  </>
                ) : (
                  <div className="paper-stack">
                    <span className="ps-name">{g.name}</span>
                    <span className="ps-rest">{g.rest}</span>
                  </div>
                )}
              </div>
              <div className="paper-body">
                {g.kind === 'art' && <p className="paper-rest">{g.rest}</p>}
                <span className="paper-meta">{g.date}</span>
              </div>
            </a>
          ))}
        </div>
        <div className="rr-cta">
          <a className="btn btn-pri rr-btn" href="#guides">
            {GUIDES.cta}
            <i className="ic-chev">›</i>
          </a>
        </div>
      </div>
    </section>
  );
}
