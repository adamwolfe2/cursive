# Cursive Design System — Token Foundation

Source of truth for the Cursive white + blue design system. Phase 1 establishes the
tokens; later phases migrate components onto them. **Light theme only** (no dark mode).

Two apps share this system:
- **App** (`/` root) — Tailwind v3, tokens in `src/app/globals.css`, wired in `tailwind.config.ts`. Register: **product** (design serves the tool).
- **Marketing** (`/marketing`) — Tailwind v4, tokens in `marketing/app/globals.css` via `@theme inline` + `:root`. Register: **brand** (design is the product).

The token **names, scales, and rendered colors are identical across both apps.** Only the
notation differs by necessity: the app uses HSL-triplet CSS vars (so Tailwind opacity
modifiers like `bg-brand-500/10` work); marketing uses hex in `@theme`. Both render the same.

---

## Color

### Brand blue ramp (`brand-*`)

Built around **#007AFF** (= `brand-500`, `hsl(211 100% 50%)`). The single brand hue.

| Token | HSL | Hex | Typical use |
|---|---|---|---|
| `brand-50` | `211 100% 97%` | `#f0f7ff` | tint backgrounds, hover wash |
| `brand-100` | `211 100% 92%` | `#d6eaff` | subtle fills, badges |
| `brand-200` | `211 100% 85%` | `#b3d7ff` | borders on blue surfaces |
| `brand-300` | `211 100% 74%` | `#7abaff` | disabled/secondary accents |
| `brand-400` | `211 100% 62%` | `#3d9bff` | hover states |
| `brand-500` | `211 100% 50%` | `#007AFF` | **primary actions, links, focus** |
| `brand-600` | `214 100% 45%` | `#0063e6` | primary hover/active |
| `brand-700` | `216 92% 38%` | `#084fba` | pressed, high-contrast text on light |
| `brand-800` | `217 84% 31%` | `#0d4091` | dense data viz |
| `brand-900` | `218 75% 26%` | `#113574` | headings on tint |
| `brand-950` | `220 70% 16%` | `#0c1f45` | max-contrast blue |

Consume: app `bg-brand-500` / `text-brand-600` (or `hsl(var(--brand-500))`); marketing `bg-brand-500`.

### Neutral gray ramp (`--gray-*` / app Tailwind `ink-*`)

Hue-220 tinted neutral (never pure `#000`/`#fff` in the mid-ramp). Values coincide with
Tailwind's default `gray` at 50–300/500, so migration is low-risk.

| Token | HSL | Hex |
|---|---|---|
| `gray-50` | `220 20% 98%` | `#f9fafb` |
| `gray-100` | `220 16% 96%` | `#f3f4f6` |
| `gray-200` | `220 13% 91%` | `#e5e7eb` |
| `gray-300` | `220 12% 84%` | `#d1d5db` |
| `gray-400` | `220 10% 66%` | `#a0a5b1` |
| `gray-500` | `220 9% 46%` | `#6b7280` |
| `gray-600` | `220 11% 34%` | `#4d5460` |
| `gray-700` | `220 13% 26%` | `#3a3f4b` |
| `gray-800` | `220 14% 18%` | `#272c34` |
| `gray-900` | `220 13% 13%` | `#1d2025` |
| `gray-950` | `222 18% 8%` | `#111318` |

App exposes these as Tailwind `ink-*` (net-new namespace, so default `gray` is untouched).
Marketing keeps them as raw `--gray-*` vars for now (default `gray` utilities unchanged).

### Semantic tokens

The real component API. Reference semantics, not raw ramps.

| Semantic | App var (HSL) | Marketing token | Meaning |
|---|---|---|---|
| background | `--background` `0 0% 100%` | `--color-background` `#fff` | page base |
| surface / card | `--card` `0 0% 100%` | `--color-surface` `#fff` | raised surface |
| foreground | `--foreground` `220 13% 13%` | `--color-foreground` `#1d2025` | primary text (= gray-900) |
| muted | `--muted` `220 14% 96%` | `--color-muted` `#f3f4f6` | subtle fill (= gray-100) |
| muted-foreground | `--muted-foreground` `220 9% 46%` | `--color-muted-foreground` `#6b7280` | secondary text (= gray-500) |
| border | `--border` `220 13% 91%` | `--color-border` `#e5e7eb` | hairlines (= gray-200) |
| primary | `--primary` `211 100% 50%` | `--color-primary` `#007AFF` | brand action (= brand-500) |
| primary-foreground | `--primary-foreground` `0 0% 100%` | `--color-primary-foreground` `#fff` | text on primary |
| ring | `--ring` `217 91% 50%` | `--color-ring` `#007AFF` | focus ring |
| success | `--success` `152 69% 41%` | `--color-success` `#16a34a` | positive |
| warning | `--warning` `38 92% 50%` | `--color-warning` `#d97706` | caution |
| danger / destructive | `--destructive` `0 72% 51%` | `--color-danger` `#dc2626` | error/destructive |

App also ships `secondary`, `accent`, `popover`, `info`, `input`, `border-light`,
`border-focus`, `card-elevated`, and `*-muted` semantic variants (see `src/app/globals.css`).

**Naming drift to reconcile later:** app uses `destructive`; marketing uses `danger`. Unify in a later phase (add a `destructive` alias in marketing or `danger` in app).

### Color strategy

**Restrained.** Tinted-neutral surface + a single accent (brand blue) carrying < 10% of any
view. Blue signals interactivity and brand; everything else is neutral. Success/warning/danger
are functional only, never decorative.

---

## Spacing

4px base scale. `--space-0` = 0 → `--space-16` = 4rem (0,1,2,3,4,5,6,8,10,12,16 × 0.25rem).
Plus app Tailwind extras `spacing.18` (4.5rem), `spacing.22` (5.5rem). Vary padding for
rhythm; do not apply uniform padding everywhere.

## Border radius

Crisp, consistent. `--radius` = **0.5rem** is the default (`rounded-lg`).

| Token | Value | Tailwind (app) |
|---|---|---|
| `--radius-sm` | 0.375rem | `rounded-sm` (`radius - 4px`) |
| `--radius` | 0.5rem | `rounded-lg` |
| `--radius` − 2px | 0.375rem | `rounded-md` |
| `--radius-lg` | 0.75rem | — |
| `--radius-xl` | 1rem | `rounded-xl` |

Full pills (`rounded-full`) for avatars/badges only. Never mix arbitrary radii on one surface.

## Shadows

Subtle, layered, monochrome. `xs` → `xl`. Use `sm` for resting cards, `md` for hover lift,
`lg`/`xl` for popovers/modals only. Never colored shadows.

`--shadow-xs .. --shadow-xl` (identical values in both apps). App Tailwind: `shadow-enterprise-{xs,sm,md,lg,xl}`.

## Z-index

`--z-dropdown 1000` · `sticky 1020` · `fixed 1030` · `modal-backdrop 1040` · `modal 1050`
· `popover 1060` · `tooltip 1070` · `toast 1080`. Never invent ad-hoc `z-[9999]`.

## Motion

Durations: `--duration-fast 150ms` · `--duration-base 200ms` · `--duration-slow 300ms`
(aliased to legacy `--transition-*`). Easing: prefer **exponential ease-out** for entrances,
never bounce/elastic. Never animate layout properties (width/height/top) — use transform/opacity.

| Token | Curve |
|---|---|
| `--ease-out` | `cubic-bezier(0, 0, 0.2, 1)` |
| `--ease-out-quart` | `cubic-bezier(0.25, 1, 0.5, 1)` |
| `--ease-out-expo` | `cubic-bezier(0.16, 1, 0.3, 1)` |
| `--ease-in-out` | `cubic-bezier(0.4, 0, 0.2, 1)` |

App Tailwind exposes `ease-out-quart` / `ease-out-expo`. Respect `prefers-reduced-motion`
(already handled globally in the app).

---

## Typography

- **Inter** — body + UI face. `--font-sans` (app) / `--font-inter` → `--font-sans` (marketing),
  loaded via `next/font`. `display: swap`. This is the ONLY UI typeface.
- **Dancing Script** — intentional accent ONLY. Applied via the `font-cursive` utility /
  `--font-dancing-script`. **Marketing only.** Reserved for the "Cursive" wordmark and short
  brand-flourish phrases. Never body copy, never UI, never in the app. Weight 400 only.

### Type scale (≥1.25 step contrast; hierarchy via size + weight)

| Role | Size | Weight |
|---|---|---|
| Display | ~2.25rem+ | 600 |
| Page title | 1.5rem (`text-2xl`) | 600 |
| Section title | 1.125–1.25rem | 600 |
| Body | 1rem (`text-base`) | 400 |
| Small / label | 0.875rem (`text-sm`) | 400–500 |
| Caption | 0.75rem (`text-xs`) | 500 |
| Micro | 0.625rem (`text-2xs`, app) | 500 |

Weights: 400 body, 500 labels/nav, 600 headings/emphasis. Body line length 65–75ch.
Mono: `--font-mono` (JetBrains Mono) for code/data only.

---

## Usage rules

1. **The marketing homepage HERO is LOCKED.** Do not restyle
   `marketing/components/human-home-page.tsx` hero / above-the-fold. Tokens are additive and
   must not change its rendered output.
2. **Dancing Script is accent-only** (wordmark + brand flourish, marketing only). Never body/UI.
3. **Reference semantics, not raw ramps** in components (`primary`, `foreground`, `border`),
   except intentional palette work (data viz, gradients) which may use `brand-*` / `gray-*`.
4. **Blue = interactivity + brand.** Keep it under ~10% of any view (Restrained strategy).
5. **Light theme only.** No `dark:` variants (app `darkMode` is disabled).
6. **Additive/backward-compatible:** never override Tailwind's default `blue`/`gray`/`neutral`.
   New ramps live under `brand` / `ink` (app) and `brand-*` + raw `--gray-*` (marketing).

## Known drift (for later phases to clean up)

- **Gradients & `bg-clip-text`** in the app (`.text-gradient-*`, `.bg-gradient-cursive*`,
  `border-gradient-cursive`) use raw `blue-*`/`indigo-*` and gradient text. Migrate to `brand-*`;
  gradient text is an anti-pattern (prefer solid color + weight).
- **Glassmorphism helpers** (`.glass-card`, `.glass-header`, `.glass-sidebar`) — audit; keep
  only where purposeful.
- **Raw hex in marketing prose** (`.prose` uses `#6b7280`, `#111827`, `#374151`, `#f3f4f6`) —
  migrate to `--gray-*` / semantic tokens.
- **Dead `.dark` block** in `src/app/globals.css` (darkMode is `never-match`) — remove later.
- **`destructive` vs `danger`** naming split between app and marketing — unify.
- **`blue-*` / `indigo-*` literal utilities** scattered across both apps — migrate to `brand-*`.
- **Radius/shadow unification in marketing:** vars are defined but marketing components still
  use Tailwind defaults; migrate component-by-component in later phases.
