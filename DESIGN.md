# CubicJ Cafe Design System

Light-only. Warm neutrals, one coffee accent, engineering-console restraint. This file is the single source of truth for visual decisions; when styling anything, follow it instead of shadcn/Tailwind defaults.

## Direction

Generation console: the UI reads like an operator tool (queue, servers, models), not a marketing page. Restraint over ornament. No gradients, no glassmorphism, no glow, no sparkle/wand icons, no emoji in UI copy.

## Tokens (globals.css is the implementation)

- Ground `--background`: warm off-white `oklch(0.975 0.006 75)`; cards are lighter than the ground (`--card: oklch(0.995 0.003 80)`) so surfaces separate by background shift, not borders.
- Text `--foreground`: dark brown-gray `oklch(0.22 0.015 60)`; muted `oklch(0.5 0.02 60)`.
- Accent `--primary`: coffee brown `oklch(0.45 0.1 55)` (derived from brand `#8B4513`). Used ONLY for primary buttons, active segmented controls, focus ring, links. Never decorative.
- Destructive: stock red kept. Status tones live in `src/lib/badge-palette.ts`, nowhere else.
- Radius `--radius: 0.375rem`. Shadows only on true overlays (dropdown, dialog); never on buttons, cards, or active controls.

## Typography

- One family: IBM Plex Sans KR (400/500/600/700). Hierarchy by weight/size only.
- `font-mono` is IBM Plex Mono with `tabular-nums`: queue positions, counts, timestamps, model filenames, IDs, log console, the model lineup line.
- Scale (fixed, no per-page improvisation): page title `text-2xl font-bold`; section heading `text-sm font-semibold text-muted-foreground` with an `h-4 w-4` icon; body `text-sm`; meta `text-xs`.

## Separation order

Whitespace → background shift (card vs ground) → hairline `border` → never a shadow. No card-in-card.
The `/i2v` form sections deliberately use Card containers per the user ruling on 2026-08-21; the no-card-in-card rule still applies.

## Mobile

Design mobile and desktop together. State the mobile stacking order before building. Touch targets ≥ 44px. Verify both viewports before calling anything done.
