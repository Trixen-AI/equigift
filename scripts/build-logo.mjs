// Builds the Equigift logo from one source of truth.
// Mark: a pie chart (a company) with one slice lifted out, ribbon-wrapped and
// topped with a bow (the share you give). Wordmark: "equigift" in Geist Medium, outlined to
// paths with opentype.js and set on the pie's baseline.
// Outputs:
//   src/components/brand/logoData.ts      path data for the inline React logo (one SVG)
//   public/brand/logo.svg / logo-dark.svg horizontal lockup, outlined
//   public/brand/logo-500.png             500x500, vertical lockup on the brand colour
//   public/brand/logo-500-transparent.png 500x500, vertical lockup on transparent
//   public/favicon.svg                    the mark on an ink tile
// Run: node scripts/build-logo.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import opentype from 'opentype.js';
import { Resvg } from '@resvg/resvg-js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = (p) => resolve(root, p);

// Tokens (keep in sync with src/styles/tokens.css)
const BRAND = '#f98500';
const INK = '#0a0a0b';
const WHITE = '#ffffff';

// ---- mark geometry (64 grid, content spans x 3..60, y ~1..64) ----
// A pie (the company) with one slice lifted out, wrapped in a ribbon cross and
// topped with a bow (the gifted share). The ribbon is negative space, so the
// slice is four pieces and the mark works on any background without masks.
const C = { cx: 35, cy: 32, r: 25 }; // slice centre and radius
const RIB = { x: 46, y: 21, h: 1.25 }; // ribbon cross position and half width
const f2 = (n) => +n.toFixed(2);
const arcX = (y) => C.cx + Math.sqrt(C.r ** 2 - (y - C.cy) ** 2);
const arcY = (x) => C.cy - Math.sqrt(C.r ** 2 - (x - C.cx) ** 2);
const PIE = `M${C.cx - 7} ${C.cy + 7}L${C.cx - 7} ${C.cy + 7 - C.r}A${C.r} ${C.r} 0 1 0 ${C.cx - 7 + C.r} ${C.cy + 7}Z`;
const SLICE = [
  `M${C.cx} ${C.cy}V${f2(RIB.y + RIB.h)}H${f2(RIB.x - RIB.h)}V${C.cy}Z`,
  `M${f2(RIB.x + RIB.h)} ${C.cy}H${C.cx + C.r}A${C.r} ${C.r} 0 0 0 ${f2(arcX(RIB.y + RIB.h))} ${f2(RIB.y + RIB.h)}H${f2(RIB.x + RIB.h)}Z`,
  `M${C.cx} ${f2(RIB.y - RIB.h)}V${C.cy - C.r}A${C.r} ${C.r} 0 0 1 ${f2(RIB.x - RIB.h)} ${f2(arcY(RIB.x - RIB.h))}V${f2(RIB.y - RIB.h)}Z`,
  `M${f2(RIB.x + RIB.h)} ${f2(RIB.y - RIB.h)}V${f2(arcY(RIB.x + RIB.h))}A${C.r} ${C.r} 0 0 1 ${f2(arcX(RIB.y - RIB.h))} ${f2(RIB.y - RIB.h)}Z`,
];
// bow: two loops sitting on the arc where the vertical ribbon leaves the slice
const bowTop = f2(arcY(RIB.x));
const BOW = [
  `M${RIB.x} ${f2(bowTop - 1)}C${RIB.x - 4} ${f2(bowTop - 9)} ${RIB.x - 11} ${f2(bowTop - 6)} ${RIB.x - 7} ${f2(bowTop - 2)}Z`,
  `M${RIB.x} ${f2(bowTop - 1)}C${RIB.x + 4} ${f2(bowTop - 9)} ${RIB.x + 11} ${f2(bowTop - 6)} ${RIB.x + 7} ${f2(bowTop - 2)}Z`,
];
const BOW_W = 2.6;
const markBody = (pieC, sliceC) =>
  `<path d="${PIE}" fill="${pieC}"/>` +
  SLICE.map((d) => `<path d="${d}" fill="${sliceC}"/>`).join('') +
  `<g fill="none" stroke="${sliceC}" stroke-width="${BOW_W}" stroke-linejoin="round">${BOW.map((d) => `<path d="${d}"/>`).join('')}</g>`;

// ---- fonts / outlining ----
const font = opentype.parse(readFileSync(out('scripts/fonts/Geist-Medium.ttf')).buffer);
const textPath = (str, size, track, x0 = 0, baseline = 0) => {
  let cx = x0;
  const p = new opentype.Path();
  const gs = font.stringToGlyphs(str);
  gs.forEach((g, i) => {
    p.extend(g.getPath(cx, baseline, size));
    let adv = (g.advanceWidth / font.unitsPerEm) * size;
    if (i < gs.length - 1) adv += (font.getKerningValue(g, gs[i + 1]) / font.unitsPerEm) * size + track;
    cx += adv;
  });
  return p;
};
const atOrigin = (p) => {
  const b = p.getBoundingBox();
  const s = new opentype.Path();
  p.commands.forEach((c) => {
    const n = { ...c };
    for (const k of ['x', 'y', 'x1', 'y1', 'x2', 'y2']) if (k in n) n[k] = +(n[k] - (k.startsWith('x') ? b.x1 : b.y1)).toFixed(2);
    s.commands.push(n);
  });
  return { d: s.toPathData(2), w: +(b.x2 - b.x1).toFixed(2), h: +(b.y2 - b.y1).toFixed(2) };
};

// ---- horizontal lockup, one coordinate space: wordmark baseline = box bottom (y 58) ----
const WORD_SIZE = 50;
const WORD_X = 72;
const wordInLockup = textPath('equigift', WORD_SIZE, -0.02 * WORD_SIZE, WORD_X, 58);
const wb = wordInLockup.getBoundingBox();
const LOCK = {
  x: 2,
  y: Math.min(0.5, wb.y1) - 1,
  w: +(wb.x2 - 2 + 1).toFixed(2),
  h: +(Math.max(64, wb.y2) - Math.min(0.5, wb.y1) + 2).toFixed(2),
  word: wordInLockup.toPathData(2),
};
LOCK.y = +LOCK.y.toFixed(2);
const vb = `${LOCK.x} ${LOCK.y} ${LOCK.w} ${LOCK.h}`;

// standalone wordmark (footer) and the neutral S&P 500 text mark
const WM = atOrigin(textPath('equigift', 100, -1.2));
// Neutral outlined text mark: no official logo file exists for the S&P 500 index itself.
const SP = atOrigin(textPath('S&P 500', 100, -1.5));

mkdirSync(out('src/components/brand'), { recursive: true });
writeFileSync(
  out('src/components/brand/logoData.ts'),
  `// Generated by scripts/build-logo.mjs. Do not edit by hand.\n` +
    `export const MARK = ${JSON.stringify({ pie: PIE, slice: SLICE, bow: BOW, bowWidth: BOW_W })} as const;\n` +
    `export const LOCKUP = ${JSON.stringify({ viewBox: vb, word: LOCK.word })} as const;\n` +
    `export const WORDMARK = ${JSON.stringify(WM)} as const;\n` +
    `// Neutral outlined text mark: no official S&P 500 logo file exists for the index itself.\n` +
    `export const SP500_TEXT = ${JSON.stringify(SP)} as const;\n`,
);

const lockupSvg = (pieC, sliceC, wordC) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" width="${LOCK.w}" height="${LOCK.h}">${markBody(pieC, sliceC)}<path fill="${wordC}" d="${LOCK.word}"/></svg>`;
mkdirSync(out('public/brand'), { recursive: true });
writeFileSync(out('public/brand/logo.svg'), lockupSvg(INK, BRAND, INK));
writeFileSync(out('public/brand/logo-dark.svg'), lockupSvg(WHITE, BRAND, WHITE));

// ---- vertical lockup for the 500px squares (12% padding) ----
const square = (bg, pieC, sliceC, wordC) => {
  const S = 500;
  const pad = S * 0.12;
  const inner = S - pad * 2;
  const markSize = 170; // drawn size of the 64-unit grid
  const markH = (64 - 0.5) * (markSize / 64);
  const wS = inner / WM.w;
  const wH = WM.h * wS;
  const gap = 36;
  const top = (S - (markH + gap + wH)) / 2;
  const mx = (S - markSize) / 2 - 1.5 * (markSize / 64);
  const my = top - 0.5 * (markSize / 64);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}" width="${S}" height="${S}">
  ${bg ? `<rect width="${S}" height="${S}" fill="${bg}"/>` : ''}
  <g transform="translate(${mx} ${my.toFixed(2)}) scale(${markSize / 64})">${markBody(pieC, sliceC)}</g>
  <path transform="translate(${pad} ${(top + markH + gap).toFixed(2)}) scale(${wS.toFixed(4)})" fill="${wordC}" d="${WM.d}"/>
</svg>`;
};
const png = (svg, file) => writeFileSync(out(file), new Resvg(svg, { fitTo: { mode: 'width', value: 500 } }).render().asPng());
png(square(BRAND, INK, WHITE, INK), 'public/brand/logo-500.png');
png(square(null, INK, BRAND, INK), 'public/brand/logo-500-transparent.png');

// ---- favicon: white pie, orange slice on an ink tile ----
writeFileSync(
  out('public/favicon.svg'),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="${INK}"/><g transform="translate(7.6 6.4) scale(0.78)">${markBody(WHITE, BRAND)}</g></svg>`,
);

// ---- app icons (home screen / PWA): mark on an ink tile, full bleed for maskable use ----
const tile = (size, radius) => {
  const m = size * 0.62; // mark size, keeps it inside the maskable safe zone
  const o = (size - m) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${radius}" fill="${INK}"/><g transform="translate(${(o - 1.5 * (m / 64)).toFixed(2)} ${(o - 0.5 * (m / 64)).toFixed(2)}) scale(${(m / 64).toFixed(4)})">${markBody(WHITE, BRAND)}</g></svg>`;
};
const pngAt = (svg, w, file) => writeFileSync(out(file), new Resvg(svg, { fitTo: { mode: 'width', value: w } }).render().asPng());
pngAt(tile(180, 0), 180, 'public/apple-touch-icon.png');
pngAt(tile(192, 0), 192, 'public/icon-192.png');
pngAt(tile(512, 0), 512, 'public/icon-512.png');

// ---- social share image (Open Graph / X card), 1200 x 630 ----
const og = (() => {
  const W = 1200;
  const H = 630;
  const lockH = 66;
  const lockScale = lockH / LOCK.h;
  const head1 = textPath('A stock, wrapped', 92, -1.8);
  const head2 = textPath('as a gift.', 92, -1.8);
  const sub1 = textPath('Apple, Nvidia, Tesla or the S&P 500.', 29, -0.2);
  const sub2 = textPath('Claimed with an email or X. No wallet, no app.', 29, -0.2);
  const foot = textPath('equigift.xyz', 26, 0);
  const at = (p, x, baseline) => {
    const b = p.getBoundingBox();
    return `<path transform="translate(${(x - b.x1).toFixed(1)} ${baseline})" d="${p.toPathData(2)}"/>`;
  };
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <defs>
    <radialGradient id="glow" cx="0.86" cy="1.05" r="0.75"><stop offset="0" stop-color="${BRAND}" stop-opacity="0.55"/><stop offset="1" stop-color="${BRAND}" stop-opacity="0"/></radialGradient>
    <pattern id="dots" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="11" cy="11" r="1.3" fill="#ffffff" fill-opacity="0.09"/></pattern>
  </defs>
  <rect width="${W}" height="${H}" fill="${INK}"/>
  <rect width="${W}" height="${H}" fill="url(#dots)"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>
  <g transform="translate(72 64) scale(${lockScale.toFixed(4)}) translate(${-LOCK.x} ${-LOCK.y})">${markBody(WHITE, BRAND)}<path fill="${WHITE}" d="${LOCK.word}"/></g>
  <g fill="${WHITE}">${at(head1, 72, 300)}</g>
  <g fill="${BRAND}">${at(head2, 72, 398)}</g>
  <g fill="#a3a3a3">${at(sub1, 74, 466)}${at(sub2, 74, 504)}</g>
  <g fill="#7a7a7a">${at(foot, 74, 572)}</g>
  <g transform="translate(918 352) scale(3.5)">${markBody('#1c1c1d', BRAND)}</g>
</svg>`;
})();
pngAt(og, 1200, 'public/og-image.png');

console.log('lockup viewBox', vb, 'wordmark', WM.w, WM.h);
