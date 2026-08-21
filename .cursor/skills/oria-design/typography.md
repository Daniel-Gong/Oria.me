# Oria typography

## Pairing

- **Source Serif 4** — all narrative type: brand, headlines, body, giant statements.
- **Red Hat Mono** — system chrome only: section labels, nav, buttons, progress hints, fragment chips.

Do not mix mono into paragraphs. Do not use a third family.

## Scale

Use `clamp()` for display sizes. Prefer weight **400** for serif display; **500** for mono labels/CTAs.

### Labels & chrome

```css
.mono-label {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-cedar);
}
```

Nav / button mono: `0.8125rem`, tracking `0.02em`–`0.04em`.

### Headings

```css
.section-heading {
  font-family: var(--font-serif);
  font-weight: 400;
  font-size: clamp(2.25rem, 5vw, 3.5rem);
  letter-spacing: -0.03em;
  line-height: 1.1;
  color: var(--color-walnut);
}

.display-heading {
  font-size: clamp(3rem, 8vw, 5.5rem);
  letter-spacing: -0.04em;
}

.display-heading em,
.mission-heading em,
.vision-giant em {
  font-style: italic;
  color: var(--color-faded-rose); /* light sections */
}
```

On dark sections (e.g. Values), giant italic uses `--color-apricot-wash` on parchment text.

### Hero

| Element | Spec |
|---------|------|
| Brand wordmark | Serif, `clamp(1.5rem, 3vw, 2rem)`, tracking `0.28em` — must dominate first viewport |
| Title | Serif, `clamp(3.4rem, 11vw, 7.5rem)`, tracking `-0.045em`, LH tight |
| Subtitle | Serif, `clamp(1.05rem, 2vw, 1.25rem)`, secondary cedar |

### Giants (scroll stories)

| Context | Size | Tracking | LH |
|---------|------|----------|-----|
| Vision giant | `clamp(3.75rem, 11vw, 7.5rem)` | `-0.045em` | `0.95` |
| Value giant | `clamp(4.5rem, 14vw, 9.5rem)` | `-0.05em` | `0.92` |

Mobile: reduce giants to ~`clamp(2.35rem, 11.5vw, 3.25rem)` so lines don’t overflow.

### Body

| Class | Size | LH | Color |
|-------|------|----|-------|
| Base `body` | `1.0625rem` | `1.55` | walnut |
| `.section-lede` | `1.25rem` | `1.45` | cedar |
| `.body-xl` / vision copy | `clamp(1.35rem, 2.4vw, 1.75rem)` | `1.4` | walnut |
| `.body-lg` | `1.2rem` | `1.5` | cedar |

Links in body: underline, offset `0.2em`, decoration `rgba(93, 82, 75, 0.35)` → walnut on hover.

## Hierarchy patterns

1. **Section block:** `.mono-label` → `.section-heading` → optional `.section-lede`
2. **Story beat:** giant serif (optional italic half) *or* `.body-xl` — not both competing
3. **Brand test:** remove nav; first viewport must still read as Oria via wordmark/hero type

## Don’t

- Inter / system-ui as primary
- All-caps serif headlines
- Tracking > `0.05em` on large serif (except brand wordmark)
- Multiple competing display sizes in one viewport
