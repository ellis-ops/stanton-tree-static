// Branded 1080x1080 social card generator (Vercel Edge + @vercel/og).
// GET /api/social-image?p=<base64url JSON>
// payload: { kicker, headline, body, bullets?: [{n,title,desc}] }
// headline: words wrapped in *stars* render as green italic serif.
// body: words wrapped in **double stars** render green & bolder.
import { ImageResponse } from '@vercel/og';

export const config = { runtime: 'edge' };

const INK = '#16201A';
const GREEN = '#3E8E63';
const BODY = '#3C4A42';
const CREAM = '#F7F6F0';
const HAIR = '#DDDFD5';
const SITE = 'https://stantontreeservice.com';

// element helper for satori's react-like tree
function el(type, style, children, extra) {
  return { type, props: { style, children, ...(extra || {}) } };
}

let fontsPromise = null;
function loadFonts() {
  if (!fontsPromise) fontsPromise = (async () => {
    const cssUrls = [
      'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;1,600&display=swap',
      'https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap',
      'https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap'
    ];
    const fonts = [];
    for (const u of cssUrls) {
      // No browser User-Agent -> Google Fonts serves TTF (satori can't read woff2)
      const css = await (await fetch(u)).text();
      const blocks = css.match(/@font-face\s*{[^}]+}/g) || [];
      for (const b of blocks) {
        const fam = (b.match(/font-family:\s*'([^']+)'/) || [])[1];
        const styleM = (b.match(/font-style:\s*(\w+)/) || [])[1] || 'normal';
        const weight = parseInt((b.match(/font-weight:\s*(\d+)/) || [])[1] || '400', 10);
        const url = (b.match(/url\((https:[^)]+\.ttf)\)/) || [])[1];
        if (!fam || !url) continue;
        const data = await (await fetch(url)).arrayBuffer();
        fonts.push({ name: fam, data, weight, style: styleM });
      }
    }
    return fonts;
  })();
  return fontsPromise;
}

let logoPromise = null;
function loadLogo() {
  if (!logoPromise) logoPromise = (async () => {
    try {
      const r = await fetch(SITE + '/assets/Stanton-Tree-Service-b7541d5a.svg');
      if (!r.ok) return null;
      const svg = await r.text();
      return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
    } catch { return null; }
  })();
  return logoPromise;
}

// "Same *tree*." -> spans, *...* = green italic serif
function richHeadline(text, fontSize) {
  const parts = String(text).split(/(\*[^*]+\*)/g).filter(Boolean);
  return parts.map(p => p.startsWith('*') && p.endsWith('*')
    ? el('span', { fontFamily: 'Playfair Display', fontStyle: 'italic', color: GREEN, fontSize, marginRight: 14 }, p.slice(1, -1) + ' ')
    : el('span', { fontFamily: 'Playfair Display', color: INK, fontSize, marginRight: 14 }, p)
  );
}

// body with **green** accents
function richBody(text, fontSize) {
  const parts = String(text).split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  return parts.map(p => p.startsWith('**') && p.endsWith('**')
    ? el('span', { color: GREEN, fontWeight: 600, fontSize, marginRight: 8 }, p.slice(2, -2) + ' ')
    : el('span', { color: BODY, fontSize, marginRight: 8 }, p)
  );
}

export default async function handler(req) {
  try {
    const url = new URL(req.url);
    const raw = url.searchParams.get('p');
    let d = {};
    if (raw) {
      const b64 = raw.replace(/-/g, '+').replace(/_/g, '/');
      d = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(b64), c => c.charCodeAt(0))));
    }
    const kicker = d.kicker || 'METRO ATLANTA · TREE CARE';
    const headline = d.headline || 'Your trees, in *steady* hands.';
    const body = d.body || '';
    const bullets = Array.isArray(d.bullets) ? d.bullets.slice(0, 5) : null;

    const plainLen = String(headline).replace(/\*/g, '').length;
    const hSize = plainLen > 80 ? 58 : plainLen > 55 ? 68 : 82;

    const [fonts, logo] = await Promise.all([loadFonts(), loadLogo()]);

    const headerRow = el('div', { display: 'flex' }, [
      logo
        ? el('div', { display: 'flex', backgroundColor: '#FFFFFF', padding: '14px 18px', borderRadius: 2 },
            [{ type: 'img', props: { src: logo, width: 96, height: 52 } }])
        : el('div', { display: 'flex', flexDirection: 'column', backgroundColor: '#FFFFFF', padding: '14px 18px' }, [
            el('span', { fontFamily: 'Playfair Display', fontSize: 30, color: INK }, 'Stanton'),
            el('span', { fontFamily: 'Space Mono', fontSize: 11, letterSpacing: 3, color: GREEN }, 'TREE SERVICE')
          ])
    ]);

    const kickerEl = el('div', { display: 'flex', marginTop: 44 },
      [el('span', { fontFamily: 'Space Mono', fontSize: 23, letterSpacing: 7, color: GREEN }, String(kicker).toUpperCase())]);

    const headlineEl = el('div', { display: 'flex', flexWrap: 'wrap', marginTop: 22, lineHeight: 1.16, maxWidth: 980 },
      richHeadline(headline, hSize));

    const middle = [];
    if (bullets && bullets.length) {
      const rows = bullets.map((b, i) => el('div', {
        display: 'flex', alignItems: 'flex-start', paddingTop: 26, paddingBottom: 26,
        borderTop: i === 0 ? `1px solid ${HAIR}` : undefined,
        borderBottom: `1px solid ${HAIR}`
      }, [
        el('span', { fontFamily: 'Playfair Display', fontStyle: 'italic', fontSize: 36, color: GREEN, width: 76, flexShrink: 0 }, String(b.n || i + 1)),
        el('div', { display: 'flex', flexDirection: 'column', flexGrow: 1 }, [
          el('span', { fontFamily: 'Inter', fontWeight: 600, fontSize: 30, color: INK }, String(b.title || '')),
          b.desc ? el('span', { fontFamily: 'Inter', fontSize: 25, color: '#6B776F', marginTop: 6 }, String(b.desc)) : null
        ].filter(Boolean))
      ]));
      middle.push(el('div', { display: 'flex', flexDirection: 'column', marginTop: 40 }, rows));
      if (body) middle.push(el('div', { display: 'flex', flexWrap: 'wrap', marginTop: 34, lineHeight: 1.5, maxWidth: 960, fontFamily: 'Inter' }, richBody(body, 27)));
    } else if (body) {
      middle.push(el('div', { display: 'flex', flexWrap: 'wrap', marginTop: 44, lineHeight: 1.55, maxWidth: 960, fontFamily: 'Inter' }, richBody(body, 31)));
    }

    const footer = el('div', {
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      borderTop: `1px solid ${HAIR}`, paddingTop: 34, marginTop: 'auto'
    }, [
      el('span', { fontFamily: 'Space Mono', fontSize: 27, letterSpacing: 3, color: INK }, '(470) 914-3402'),
      el('span', { fontFamily: 'Space Mono', fontSize: 27, letterSpacing: 2, color: INK }, 'stantontreeservice.com')
    ]);

    const card = el('div', {
      display: 'flex', flexDirection: 'column', width: 1080, height: 1080,
      backgroundColor: CREAM, padding: 64, fontFamily: 'Inter'
    }, [headerRow, kickerEl, headlineEl, ...middle, footer]);

    return new ImageResponse(card, {
      width: 1080, height: 1080, fonts,
      headers: { 'Cache-Control': 'public, max-age=31536000, immutable' }
    });
  } catch (e) {
    return new Response('card error: ' + e.message, { status: 500 });
  }
}
