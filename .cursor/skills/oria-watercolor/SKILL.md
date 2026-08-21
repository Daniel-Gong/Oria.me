---
name: oria-watercolor
description: >-
  Generate and apply Oria editorial abstract watercolor washes for section
  backgrounds and atmospheric art. Use when creating watercolor backgrounds,
  vision/hero washes, parchment manuscript art, or when the user mentions
  watercolor, wash, 水彩, or Oria art assets.
disable-model-invocation: false
---

# Oria Watercolor Washes

Abstract wet-on-wet watercolor backgrounds for Oria’s editorial manuscript look.
Not illustrations of objects — soft pigment blooms on parchment that sit behind type.

**Related:** typography & motion → [oria-design](../oria-design/SKILL.md) · CSS orb washes → [oria-orb-wash](../oria-orb-wash/SKILL.md)

## When to use

- Section / scroll-story backgrounds (e.g. Vision)
- Atmospheric hero or chapter washes
- Replacing awkward photo or figurative art with abstract washes

## Visual rules

| Do | Don’t |
|----|--------|
| Abstract pigment blooms only | Text, logos, UI, people, icons, objects |
| Wet-on-wet soft bleeds, paper grain | Hard edges, geometric shapes, neon glow |
| Warm cream parchment ground | Pure white or dark/black canvas |
| Quiet, airy, editorial | Busy, decorative clutter, high contrast |
| Landscape for full-bleed web BGs | Square crops unless asked |

**Mood:** calm manuscript atmosphere — humanist, soft, refined.

## Brand palette

Use these (or close muted cousins). Prefer 2–4 colors per wash + parchment ground.

| Token | Hex | Role |
|-------|-----|------|
| Parchment | `#fef9ed` | Ground / paper |
| Bone | `#f5f0e4` | Soft secondary ground |
| Library ink | `#2e4d4d` | Cool teal depth |
| Slate lilac | `#666583` | Cool violet wash |
| Sage | `#7a8f7a` | Calm green |
| Apricot wash | `#fbd3be` | Warm peach |
| Faded rose | `#8c5462` | Dusty rose |
| Walnut | `#5d524b` | Warm brown hint only |

**Series tip:** For multi-slide scroll stories, give each wash a distinct temperature so crossfades read clearly (cool → warm → balanced).

## Generation workflow

1. Read this skill + [prompts.md](prompts.md) for templates.
2. Generate with the gpt-image skill / script:

```bash
export OPENAI_API_KEY="$(cat "$HOME/.openai_api_key" | tr -d '\n')"
python ~/.cursor/skills/gpt-image/scripts/generate_image.py \
  --prompt "PROMPT_HERE" \
  --output assets/art/NAME.jpg \
  --size 1536x1024 \
  --quality high \
  --format jpeg \
  --compression 82
```

3. Default size for section BGs: `1536x1024`. Draft with `--quality low` if iterating.
4. Save under `assets/art/` with clear names (`vision-wash-0.jpg`, `hero-wash.jpg`, …).
5. Verify by opening the image: center should stay light enough for type; no accidental subjects.

## Prompt skeleton

Always include the locked constraints, then vary palette + composition:

```
Abstract watercolor wash background only, no text, no objects, no figures.
Soft translucent pigment blooms on warm cream parchment paper.
Palette: [2–4 brand colors from table above].
[One composition beat: e.g. cool edge blooms / two fields almost meeting / centered calm overlap].
Wet-on-wet organic bleeds, soft edges, subtle paper texture.
Landscape orientation, suitable as a website section background.
Quiet refined editorial manuscript mood, not busy.
```

Full examples: [prompts.md](prompts.md).

## Web usage (section backgrounds)

- Stack layers; crossfade with `.is-active` — one wash per scroll beat.
- Image opacity (desktop): about `0.65–0.75` once tuned; start ~`0.68`.
- Soft parchment veil on top so type stays readable; don’t crush the wash with a heavy white overlay.
- Pin scroll: for `n` slides use `(n - 1)` scroll steps so the last slide doesn’t leave a blank trailing scroll.
- Mobile: slightly lower opacity (~`0.55`) and/or stronger veil.

## Checklist before shipping

- [ ] No text/objects in the asset
- [ ] Palette matches brand tokens
- [ ] Distinct enough from sibling washes in a series
- [ ] Opacity + veil leave headline/body readable
- [ ] Scroll mapping has no empty pin segment after the last slide
