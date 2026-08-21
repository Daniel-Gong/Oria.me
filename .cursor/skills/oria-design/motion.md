# Oria motion

GSAP 3 + ScrollTrigger. Motion creates hierarchy and presence — not noise.

## Global gates

```js
function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function initializeAnimations() {
  if (typeof gsap === 'undefined' || prefersReducedMotion()) {
    // Show first slide / static stacked layout; return early
    return;
  }
  gsap.registerPlugin(ScrollTrigger);
  // …
  window.addEventListener('load', () => ScrollTrigger.refresh());
}
```

CSS companion: zero-out animation/transition durations under `@media (prefers-reduced-motion: reduce)`. Hide decorative canvases (hero flow, vision fragments).

Use `gsap.matchMedia()` with `(min-width: 769px)` vs `(max-width: 768px)` for pin vs stack.

## Easing & timing

| Use | Value |
|-----|--------|
| Entrances / reveals | `ease: 'power3.out'` |
| Scrub-linked transforms | `ease: 'none'` |
| CSS crossfade / slide settle | `cubic-bezier(0.22, 1, 0.36, 1)` |
| UI hover | `0.3s–0.35s ease` |
| Hero line duration | `~1.1s` with overlap `-=0.8` |
| Soft reveal duration | `0.7–1.1s` |
| Stagger | `0.1–0.14` (sections), `0.05` (card grids) |

## Recipe: hero entrance

```js
const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
tl.fromTo('.hero-italic', { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 1.1 })
  .fromTo('.hero-roman', { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 1.1 }, '-=0.8')
  .fromTo('.hero-subtitle', { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.85 }, '-=0.5')
  .fromTo('.hero-actions', { y: 12, opacity: 0 }, { y: 0, opacity: 1, duration: 0.75 }, '-=0.4');

gsap.to('.hero-parallax', {
  yPercent: 12,
  ease: 'none',
  scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
});
```

## Recipe: soft scroll reveal

```js
gsap.from(el, {
  y: 32,
  opacity: 0,
  duration: 0.85,
  ease: 'power3.out',
  scrollTrigger: { trigger: el, start: 'top 90%' },
});
```

Section intros: `y: 36–42`, start `'top 70%'`–`'top 75%'`. Stagger children `0.12–0.14`.

## Recipe: pinned vertical story (Vision / Values)

```js
const steps = Math.max(1, slides.length - 1); // avoid blank scroll after last beat

ScrollTrigger.create({
  trigger: pinEl,
  start: 'top top',
  end: () => `+=${steps * 100}%`,
  pin: true,
  scrub: 0.4,
  anticipatePin: 1,
  onUpdate: (self) => {
    const idx = Math.min(slides.length - 1, Math.round(self.progress * steps));
    setActiveSlide(idx); // classList is-active + optional BG crossfade
  },
});
```

**CSS slide swap:**

```css
.slide {
  opacity: 0;
  visibility: hidden;
  transform: translateY(28px) scale(0.97);
  transition: opacity 0.45s ease, transform 0.55s cubic-bezier(0.22, 1, 0.36, 1), visibility 0.45s;
}
.slide.is-active {
  opacity: 1;
  visibility: visible;
  transform: none;
}
```

Mobile: no pin; stack slides; optional light `gsap.from` stagger; BG via per-slide ScrollTrigger `onEnter` / `onEnterBack`.

## Recipe: horizontal capability rail

- Pin container; scrub `x` of rail with `ease: 'none'`, `scrub: 0.7`.
- End distance ≈ rail overflow × `1.2` (min ~`1.8 * vh`).
- Focus card: scale/opacity by distance to progress index (`scale` 0.94–1, `opacity` 0.55–1).
- Mobile: native horizontal scroll + per-card soft reveal.

## Recipe: ambient parallax

Orbs / washes: small `x`/`y` deltas, `scrub: 1.2`, `ease: 'none'`, trigger section `top bottom` → `bottom top`. Keep subtle.

## Recipe: progress bar

Thin 2px track (linen or translucent parchment); fill width = `progress * 100%` via `gsap.set` in `onUpdate`. Accent: faded-rose (light) or apricot (dark).

## CSS micro-interactions

- Buttons: `transition: transform 0.35s ease, …`; hover `scale(0.98)` (press-in, not lift).
- Header: background/backdrop transitions `0.4s ease` on scroll state.
- BG layer crossfade: opacity `0.85s` + slight scale `1.04 → 1` with editorial cubic-bezier.

## Don’t

- Bounce / elastic eases on marketing copy
- Autoplaying carousels that fight scroll
- Pin distance = `n * vh` with `floor(p * n)` (leaves empty scroll after last slide)
- Motion when `prefers-reduced-motion`
- More than ~3 competing motions in one viewport
