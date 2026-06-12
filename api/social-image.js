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

// Split marked-up text into one span per WORD so lines wrap naturally
// (satori wraps between flex children, so whole segments would jump lines otherwise).
function words(text, marker, makeSpan) {
  const re = marker === '*' ? /(\*[^*]+\*)/g : /(\*\*[^*]+\*\*)/g;
  const out = [];
  for (const part of String(text).split(re).filter(Boolean)) {
    const accent = marker === '*'
      ? part.startsWith('*') && part.endsWith('*') && !part.startsWith('**')
      : part.startsWith('**') && part.endsWith('**');
    const clean = accent ? part.slice(marker.length, -marker.length) : part;
    for (const w of clean.split(/\s+/).filter(Boolean)) {
      // glue leading punctuation ("," "." "?") onto the previous word so no gap appears
      if (/^[,.;:!?]/.test(w) && out.length) {
        const prev = out[out.length - 1];
        const punct = w.match(/^[,.;:!?]+/)[0];
        prev.props.children = String(prev.props.children) + punct;
        const rest = w.slice(punct.length);
        if (rest) out.push(makeSpan(rest, accent));
      } else {
        out.push(makeSpan(w, accent));
      }
    }
  }
  return out;
}

// "Same *tree*." -> word spans, *...* = green italic serif
function richHeadline(text, fontSize) {
  return words(text, '*', (w, accent) => el('span', {
    fontFamily: 'Playfair Display',
    fontStyle: accent ? 'italic' : 'normal',
    color: accent ? GREEN : INK,
    fontSize,
    marginRight: fontSize * 0.24
  }, w));
}

// body with **green** accents
function richBody(text, fontSize) {
  return words(text, '**', (w, accent) => el('span', {
    color: accent ? GREEN : BODY,
    fontWeight: accent ? 600 : 400,
    fontSize,
    marginRight: fontSize * 0.27
  }, w));
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
    let hSize = plainLen > 80 ? 60 : plainLen > 50 ? 72 : 86;
    // List cards carry much more content — keep the headline compact so it all fits.
    if (bullets && bullets.length) hSize = Math.min(hSize, 56);

    const [fonts, logo] = await Promise.all([loadFonts(), loadLogo()]);

    // Concentric rings decoration (top-right corner), like the reference cards.
    const rings = [520, 400, 280, 160].map(size => el('div', {
      position: 'absolute',
      top: -size * 0.38, right: -size * 0.38,
      width: size, height: size,
      borderRadius: 9999,
      border: '2.5px solid #C5DCCC'
    }, []));

    const headerRow = el('div', { display: 'flex' }, [
      logo
        ? el('div', { display: 'flex', backgroundColor: '#FFFFFF', padding: '14px 18px', borderRadius: 2 },
            [{ type: 'img', props: { src: logo, width: 96, height: 52 } }])
        : el('div', { display: 'flex', flexDirection: 'column', backgroundColor: '#FFFFFF', padding: '14px 18px' }, [
            el('span', { fontFamily: 'Playfair Display', fontSize: 30, color: INK }, 'Stanton'),
            el('span', { fontFamily: 'Space Mono', fontSize: 11, letterSpacing: 3, color: GREEN }, 'TREE SERVICE')
          ])
    ]);

    const kickerEl = el('div', { display: 'flex' },
      [el('span', { fontFamily: 'Space Mono', fontSize: 23, letterSpacing: 7, color: GREEN }, String(kicker).toUpperCase())]);

    const headlineEl = el('div', { display: 'flex', flexWrap: 'wrap', marginTop: 26, lineHeight: 1.16, maxWidth: 980 },
      richHeadline(headline, hSize));

    const middle = [];
    if (bullets && bullets.length) {
      const tight = bullets.length > 3 || (bullets.length === 3 && body);
      const rows = bullets.map((b, i) => el('div', {
        display: 'flex', alignItems: 'flex-start',
        paddingTop: tight ? 16 : 22, paddingBottom: tight ? 16 : 22,
        ...(i === 0 ? { borderTop: `1px solid ${HAIR}` } : {}),
        borderBottom: `1px solid ${HAIR}`
      }, [
        el('span', { fontFamily: 'Playfair Display', fontStyle: 'italic', fontSize: tight ? 30 : 34, color: GREEN, width: 70, flexShrink: 0 }, String(b.n || i + 1)),
        el('div', { display: 'flex', flexDirection: 'column', flexGrow: 1 }, [
          el('span', { fontFamily: 'Inter', fontWeight: 600, fontSize: tight ? 26 : 29, color: INK }, String(b.title || '')),
          b.desc ? el('span', { fontFamily: 'Inter', fontSize: tight ? 22 : 24, color: '#6B776F', marginTop: 5 }, String(b.desc)) : null
        ].filter(Boolean))
      ]));
      middle.push(el('div', { display: 'flex', flexDirection: 'column', marginTop: 30 }, rows));
      if (body) middle.push(el('div', { display: 'flex', flexWrap: 'wrap', marginTop: 26, lineHeight: 1.45, maxWidth: 960, fontFamily: 'Inter' }, richBody(body, 25)));
    } else if (body) {
      middle.push(el('div', { display: 'flex', flexWrap: 'wrap', marginTop: 40, lineHeight: 1.55, maxWidth: 940, fontFamily: 'Inter' }, richBody(body, 33)));
    }

    // Service pill chips fill the lower zone on standard cards (like the references).
    const chipLabels = Array.isArray(d.chips) ? d.chips.slice(0, 4)
      : ['TREE REMOVAL', 'TRIMMING & PRUNING', 'STUMP GRINDING', '24/7 STORM RESPONSE'];
    const chips = (!bullets || !bullets.length)
      ? el('div', { display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 34 },
          chipLabels.map(c => el('div', {
            display: 'flex', border: '1.5px solid #C7CDC1', borderRadius: 999,
            padding: '13px 24px'
          }, [el('span', { fontFamily: 'Space Mono', fontSize: 20, letterSpacing: 2, color: INK }, String(c).toUpperCase())])))
      : null;

    // Center the message block vertically so the card feels full, not top-heavy.
    const contentZone = el('div', {
      display: 'flex', flexDirection: 'column', justifyContent: 'center', flexGrow: 1,
      paddingBottom: 20, paddingTop: 8
    }, [kickerEl, headlineEl, ...middle]);

    const footer = el('div', {
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      borderTop: `1px solid ${HAIR}`, paddingTop: 34
    }, [
      el('span', { fontFamily: 'Space Mono', fontSize: 27, letterSpacing: 3, color: INK }, '(470) 914-3402'),
      el('span', { fontFamily: 'Space Mono', fontSize: 27, letterSpacing: 2, color: INK }, 'stantontreeservice.com')
    ]);

    const card = el('div', {
      display: 'flex', flexDirection: 'column', width: 1080, height: 1080,
      backgroundColor: CREAM, padding: 64, fontFamily: 'Inter', position: 'relative'
    }, [...((!bullets || !bullets.length) ? rings : []), headerRow, contentZone, chips, footer].filter(Boolean));

    return new ImageResponse(card, {
      width: 1080, height: 1080, fonts,
      headers: { 'Cache-Control': 'public, max-age=31536000, immutable' }
    });
  } catch (e) {
    return new Response('card error: ' + e.message, { status: 500 });
  }
}
