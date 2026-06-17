# CLAUDE.md

Guidance for AI assistants working in this repository.

## What this is

A **static marketing website** for **Stanton Tree Service**, a tree removal,
trimming, and stump-grinding company serving Metro Atlanta, GA. The live site is
`https://stantontreeservice.com`.

The site began as a WordPress/Elementor build and was exported to flat static
HTML. The original Elementor/WordPress JavaScript was stripped out during a
malware cleanup, so interactivity (mobile menu, dropdowns, form handling) is now
re-implemented by hand in a single small script — see `assets/site.js`.

There is **no front-end framework, no bundler, and no HTML build step.** The
`.html` files are the source of truth and are edited directly. The only Node
dependency exists for one serverless function (see below).

## Hosting & deployment

Deployed on **Vercel** with zero-config conventions:

- Every file is served as-is as a static asset.
- Files in `api/` become **serverless functions** at `/api/<name>`.
- There is no `vercel.json`; routing is purely Vercel's defaults.
- `.vercel/` is gitignored (local Vercel link data).

Deployment happens by pushing to the connected Git branch (Vercel auto-builds).
Do **not** add a custom build pipeline for the HTML — it ships verbatim.

## Repository layout

```
index.html                       Homepage
<page-slug>/index.html           One directory per page → clean URL /<page-slug>/
stump-grinding-removal-services/
  <city-slug>/index.html         Nested city sub-pages
api/contact.js                   Serverless: estimate form → email (Resend)
api/social-image.js              Serverless (Edge): branded 1080×1080 social cards
assets/                          All shared CSS, images, fonts, logo, site.js
assets/site.js                   Hand-written site JS (menu, forms, scroll)
assets/social/                   Pre-rendered social card PNGs
robots.txt                       Allows all; points to sitemap
sitemap.xml                      Manually maintained URL list
package.json                     Only dep: @vercel/og (for social-image fn)
```

There are ~45 `index.html` pages. Each one is a self-contained document:
page-specific `<head>` (title, meta description, canonical), inlined/linked
Autoptimize CSS from `assets/`, and a reference to `/assets/site.js`.

### Page types

- **Service pages** (`tree-removal-atlanta-ga/`, `stump-grinding-*-ga/`, etc.) —
  location/service landing pages, the bulk of the site (SEO-driven).
- **Blog / informational** (`how-much-does-tree-removal-cost-*`,
  `how-to-tell-if-your-tree-is-sick/`, etc.) plus the `blog/` index.
- **Core pages** — `contact/`, `service-areas/`.

## Key conventions

- **URLs use directory + `index.html`** for trailing-slash clean URLs. To add a
  page, create `new-page-slug/index.html`, never `new-page-slug.html`.
- **Shared assets are referenced from `/assets/...`** (root-absolute). Image and
  CSS filenames carry content-hash suffixes (e.g.
  `Stanton-Tree-Service-b7541d5a.svg`) inherited from the Autoptimize export —
  keep them as-is rather than renaming.
- **Every page includes `/assets/site.js`** and the business phone number
  `(470) 914-3402`. If a global UI behavior changes, change it in `site.js`
  once rather than per-page.
- **SEO matters.** Each page has a unique `<title>`, `<meta name="description">`,
  a `<link rel="canonical">` pointing to its own absolute URL, and at least the
  homepage carries `application/ld+json` schema. When adding/renaming a page,
  update `sitemap.xml` (and its `lastmod`) to match.
- **Brand colors:** primary forest green `#1b5e20` (landing-page CSS var
  `--st-primary`); the social-card generator uses ink `#16201A`, green
  `#3E8E63`, body `#3C4A42`, cream `#F7F6F0`.
- Landing-page custom styles are scoped under `.stanton-landing-page` to avoid
  colliding with leftover Elementor CSS.

## `assets/site.js` — what it does

Plain IIFE, no dependencies, no external network calls. On load it:

1. Injects a `<style>` block that fixes leftover Elementor quirks (desktop
   hover dropdowns, hiding empty placeholder boxes, blog thumbnail fit).
2. Builds a custom **mobile menu overlay** by cloning the richest existing
   `ul.elementor-nav-menu` (so it works without Elementor's JS).
3. Adds desktop dropdown hover behavior with a 350ms grace period.
4. **Wires every `form.elementor-form`** to `POST /api/contact` as JSON, with a
   honeypot field and an inline success/error UI.
5. Smooth-scrolls in-page `#anchor` links.

The form reads Elementor field names like `form_fields[name]`,
`form_fields[email]`, `form_fields[field_697db88]` (phone), etc. If form markup
changes, keep these field-name selectors in sync.

## `api/contact.js` — estimate form handler

- Node serverless function, **POST only**.
- Sends email via **Resend** (`https://api.resend.com/emails`). Requires the
  `RESEND_API_KEY` environment variable (set in the Vercel dashboard, not in the
  repo).
- Delivers to `stantontreeservice1@gmail.com`, `from` a verified Resend sender.
- Has a **honeypot**: a hidden `website` field — if filled, returns `200` without
  sending (silently drops bots).
- All user input is HTML-escaped before being placed in the email body.

## `api/social-image.js` — social card generator

- **Edge** runtime function using `@vercel/og` (satori).
- `GET /api/social-image?p=<base64url-encoded JSON>` renders a branded
  1080×1080 PNG.
- Payload shape: `{ kicker, headline, body, bullets?: [{n,title,desc}], chips? }`.
  In `headline`, `*words*` render green italic serif; in `body`, `**words**`
  render green/bold.
- Loads Google Fonts as TTF at runtime (Playfair Display, Inter, Space Mono) and
  the site logo SVG. Responses are cached 24h.
- This is the only reason `@vercel/og` is a dependency. Run `npm install` only
  if working on this function locally; the static HTML needs no install.

## Working in this repo

- **Editing content/layout:** edit the relevant `*/index.html` directly. Match
  the existing inline markup and class conventions of that page.
- **Site-wide JS/behavior:** edit `assets/site.js`.
- **New page:** create `slug/index.html`, set a unique title/description/canonical,
  link `/assets/site.js`, then add the URL to `sitemap.xml`.
- **Local preview:** serve the directory with any static server (e.g.
  `npx serve .` or `python3 -m http.server`). The `/api/*` functions only run
  under `vercel dev` or on a real Vercel deployment.
- **No test suite, linter, or CI** is configured in the repo. Validate changes by
  eye / in a browser.

## Git workflow

- Work on the branch you were assigned for the task; create it from `main` if it
  doesn't exist locally.
- Commit messages in history are short, imperative, and scoped to the area
  touched (e.g. `Mobile menu: tap-to-expand sub-pages in the drawer`,
  `Card generator: natural word-level line wrapping`). Match that style.
- Push with `git push -u origin <branch>`. Do **not** open a pull request unless
  explicitly asked.
