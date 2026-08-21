---
name: oria-design
description: >-
  Apply Oria editorial manuscript design: Source Serif 4 + Red Hat Mono
  typography, GSAP/ScrollTrigger motion, parchment color language, and
  section composition. Use when building or restyling Oria pages, choosing
  fonts, writing type CSS, adding scroll animations, pinned stories, reveals,
  or when the user mentions Oria design, 字体, 动画, typography, or motion.
disable-model-invocation: false
---

# Oria Design System

Editorial manuscript language: warm parchment canvases, serif display + mono chrome, quiet scroll storytelling. Presence over noise — 2–3 intentional motions per section, never dashboard clutter.

**Related:** watercolor washes → [oria-watercolor](../oria-watercolor/SKILL.md) · CSS orb washes → [oria-orb-wash](../oria-orb-wash/SKILL.md)

## Stack

| Layer | Choice |
|-------|--------|
| Display / body | `Source Serif 4` (400/500, roman + italic) |
| UI / labels / CTAs | `Red Hat Mono` (400/500) |
| Motion | GSAP 3 + ScrollTrigger |
| Breakpoint | Desktop motion ≥ `769px`; stack/simplify below |

Google Fonts load (keep opsz axis for Source Serif 4):

```html
<link href="https://fonts.googleapis.com/css2?family=Red+Hat+Mono:ital,wght@0,400;0,500;1,400&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,500;1,8..60,400;1,8..60,500&display=swap" rel="stylesheet">
```

## Tokens (CSS)

```css
:root {
  --color-parchment: #fef9ed;
  --color-bone: #f5f0e4;
  --color-walnut: #5d524b;
  --color-cedar: #72675b;
  --color-linen: #cec7bc;
  --color-library-ink: #2e4d4d;
  --color-apricot-wash: #fbd3be;
  --color-faded-rose: #8c5462;
  --color-slate-lilac: #666583;
  --accent-sage: #7a8f7a;

  --font-serif: "Source Serif 4", "Source Serif Pro", "Iowan Old Style", Georgia, serif;
  --font-mono: "Red Hat Mono", "IBM Plex Mono", ui-monospace, monospace;

  --radius-card: 25px;
  --radius-pill: 86px;
  --max-width: 1200px;
}
```

**Avoid:** Inter/Roboto/Arial as primary; purple-indigo AI gradients; heavy multi-layer shadows; glow; emoji decoration.

## Typography (quick)

| Role | Font | Size | Tracking | Notes |
|------|------|------|----------|-------|
| Mono label | Mono 500 | `0.75rem` | `0.08em` | Uppercase, cedar |
| Section heading | Serif 400 | `clamp(2.25rem, 5vw, 3.5rem)` | `-0.03em` | LH ~1.1 |
| Display / giant | Serif 400 | `clamp(3–9.5rem…)` | `-0.04em` to `-0.05em` | Italic `em` = faded-rose or apricot on dark |
| Hero brand | Serif | `clamp(1.5rem, 3vw, 2rem)` | `0.28em` | Wide, brand-first |
| Body | Serif 400 | `1.0625rem` base | — | Walnut on parchment |
| Body XL | Serif | `clamp(1.35rem, 2.4vw, 1.75rem)` | `-0.015em` | Story copy |
| CTA / nav | Mono 500 | `0.8125rem` | `0.02–0.04em` | Pill buttons |

**Voice in type:** Brand is hero-level. One headline + one short support per section. Italic emphasis for emotional contrast, not decoration.

Details → [typography.md](typography.md)

## Motion (quick)

**Philosophy:** Hierarchy and presence, not spectacle. Prefer opacity + small `y` rises; scrubbed pins for stories; soft parallax on orbs/washes.

| Pattern | Defaults |
|---------|----------|
| Ease (entrances) | `power3.out` |
| Ease (scrub links) | `none` |
| Soft reveal | `y: 28–42`, `opacity: 0→1`, `0.7–1.1s`, stagger `0.1–0.14` |
| ScrollTrigger start | `'top 70%'`–`'top 90%'` |
| Pin scrub | `scrub: 0.4` (story) / `0.7` (horizontal rail) |
| CSS settle | `cubic-bezier(0.22, 1, 0.36, 1)` ~0.45–0.85s |
| Hover CTA | `transform: scale(0.98)`, `0.35s ease` |

**Pinned stories:** For `n` slides use `(n - 1)` scroll steps so the last beat doesn’t leave a blank trailing scroll. Crossfade content + optional BG layers together.

**Always:** Gate GSAP behind `prefers-reduced-motion: reduce` — show static first slide / stacked layout; kill CSS animations via the site media query.

Details → [motion.md](motion.md)

## Composition rules

1. First viewport = one composition (brand, one headline, one line, one CTA group, one dominant visual).
2. Full-bleed hero / wash — not inset cards in the hero.
3. No cards unless they hold interaction; no floating badges on media.
4. One job per section.
5. Desktop storytelling can pin; mobile stacks and uses lighter reveals.

## Checklist for new UI

- [ ] Serif for reading/display; mono only for chrome/labels/CTAs
- [ ] Clamp sizes + negative tracking on large type
- [ ] Italic accent uses rose (light bg) or apricot (dark bg)
- [ ] At least one intentional entrance or scrub; no random bounce
- [ ] Reduced-motion path works without GSAP
- [ ] Watercolor BGs follow oria-watercolor if used
- [ ] Soft CSS section atmospheres follow oria-orb-wash if used
