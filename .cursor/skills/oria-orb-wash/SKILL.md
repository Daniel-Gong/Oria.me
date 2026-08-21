---
name: oria-orb-wash
description: >-
  Build Oria soft atmospheric section backgrounds with a linear gradient base
  plus large blurred color orbs (Mission-style CSS wash). Use when creating
  section backgrounds, soft gradients, ambient color fields, mission/ecosystem
  style washes, or when the user mentions orb wash, soft gradient, 渐变背景,
  模糊色块, or Mission background.
disable-model-invocation: false
---

# Oria Orb Wash (CSS)

Soft atmospheric section backgrounds made from **linear gradient + blurred orbs** — not image washes. Reference implementation: Mission section on the homepage.

**Related:** design tokens / motion → [oria-design](../oria-design/SKILL.md) · image watercolor → [oria-watercolor](../oria-watercolor/SKILL.md)

## When to use

| Use orb wash | Use watercolor images instead |
|--------------|-------------------------------|
| Quiet full-bleed section atmosphere | Scroll-story beats that need distinct painted fields |
| No asset pipeline / fast CSS-only | Hero or Vision needing paper-grain pigment art |
| Soft color temperature shift behind type | Multi-slide crossfade series |

## Recipe (3 layers)

1. **Base gradient** on the section — vertical, warm → parchment (or cool variant).
2. **3 large circles** absolutely positioned, `border-radius: 50%`, `filter: blur(80–90px)`, `opacity: 0.4–0.5`.
3. **Optional scrub parallax** on the orbs via GSAP ScrollTrigger (desktop).

Content sits above in a relative `z-index: 1` inner wrapper. Section needs `position: relative; overflow: hidden`.

## Canonical Mission palette

| Layer | Value | Role |
|-------|-------|------|
| Gradient top | `--color-apricot-wash` (`#fbd3be`) | Warm entry |
| Gradient bottom | `--color-parchment` (`#fef9ed`) | Settles into page ground |
| Orb A | `#f7c4b0` | Warm apricot, upper-left |
| Orb B | `#d9e4d4` | Soft sage, lower-right |
| Orb C | `#e4d7ea` | Quiet lilac, mid — lower opacity |

**Ecosystem variant:** flat parchment base + cooler orbs (`#dfe6ea`, `#f7d9cb`), blur `90px`, opacity `0.4`.

Keep orbs muted cousins of brand tokens — never neon, never purple-indigo AI glow.

## HTML

```html
<section class="mission" id="mission">
  <div class="mission-parallax" aria-hidden="true">
    <div class="mission-orb mission-orb-a"></div>
    <div class="mission-orb mission-orb-b"></div>
    <div class="mission-orb mission-orb-c"></div>
  </div>
  <div class="container mission-inner">
    <!-- eyebrow, heading, body -->
  </div>
</section>
```

Rename `mission-*` to the section prefix when reusing (e.g. `eco-orb`).

## CSS

```css
.section {
  position: relative;
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  align-items: center;
  padding: clamp(5rem, 12vw, 8rem) 0;
  background: linear-gradient(180deg, var(--color-apricot-wash) 0%, var(--color-parchment) 100%);
  overflow: hidden;
}

.section-parallax {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.section-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.5;
  will-change: transform;
}

.section-orb-a {
  width: 460px;
  height: 460px;
  background: #f7c4b0;
  top: -100px;
  left: 6%;
}

.section-orb-b {
  width: 400px;
  height: 400px;
  background: #d9e4d4;
  bottom: -80px;
  right: 6%;
}

.section-orb-c {
  width: 300px;
  height: 300px;
  background: #e4d7ea;
  top: 40%;
  left: 44%;
  opacity: 0.4;
}

.section-inner {
  position: relative;
  z-index: 1;
}
```

### Tuning knobs

| Knob | Typical range | Effect |
|------|---------------|--------|
| Orb size | 300–460px | Larger = softer field |
| `blur` | 80–90px | Higher = more wash-like |
| `opacity` | 0.35–0.55 | Keep type readable |
| Positions | corners + one mid | Avoid stacking all center |
| Gradient angle | `180deg` default | Stay vertical unless section asks otherwise |

## Motion (optional)

Soft scrub parallax — presence, not spectacle. Gate behind reduced-motion like other Oria GSAP.

```js
const parallax = [
  ['.section-orb-a', { y: 120, x: 50 }],
  ['.section-orb-b', { y: -90, x: -40 }],
  ['.section-orb-c', { y: 70, x: -30 }],
];
parallax.forEach(([sel, vars]) => {
  if (!document.querySelector(sel)) return;
  gsap.to(sel, {
    ...vars,
    ease: 'none',
    scrollTrigger: {
      trigger: '.section',
      start: 'top bottom',
      end: 'bottom top',
      scrub: 1.2,
    },
  });
});
```

Pair with a soft text reveal (`y: 28–42`, stagger `0.1–0.14`, `power3.out`) — see [oria-design motion](../oria-design/motion.md).

## Don’t

- Hard-edged shapes, glow, multi-layer box-shadows
- Purple → indigo “AI gradient” defaults
- Orbs so opaque that body copy loses contrast
- Cards or badges floating on the wash
- Image watercolor assets when this CSS pattern is enough

## Checklist

- [ ] Section `overflow: hidden` + relative positioning
- [ ] Gradient uses brand tokens (or muted cousins)
- [ ] 2–3 orbs, corner/mid placement, blur ≥ 80px
- [ ] Content `z-index` above parallax layer
- [ ] Parallax scrubbed + reduced-motion safe
- [ ] Headline/body remain readable on the warmest orb
