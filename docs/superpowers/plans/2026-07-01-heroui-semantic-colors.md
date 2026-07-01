# HeroUI Semantic Colors Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `apps/web` consume HeroUI v3's semantic color tokens correctly everywhere, and rewrite `apps/web/src/index.css` so its primitive palette and semantic overrides are literally consistent with `DESIGN.md` ("Dala" system).

**Architecture:** `index.css` gets two clean layers — (1) a `@theme` primitive palette using DESIGN.md's own names (void/bone/ash/smoke/plum-voltage/amber-spark/lichen), with structural greys (borders, hover washes) *derived* from Bone/Void via `color-mix()` instead of hand-picked hex, and (2) a `:root` block that maps HeroUI's semantic vars (`--background`, `--surface`, `--accent`, `--link`, `--success`, …) onto those primitives, trusting HeroUI's own calculated derived tokens (`-hover`, `-soft`) instead of re-deriving them by hand. Every component in `apps/web/src` is then swept to use the semantic Tailwind utilities (`bg-background`, `text-foreground`, `bg-accent`, `text-link`, `text-success`, …) instead of raw primitive utilities (`bg-obsidian`, `text-snow`, `bg-green`, …).

**Tech Stack:** Tailwind CSS v4 (`@theme`), `@heroui/styles` v3.1.0 semantic tokens, React/TanStack Router components in `apps/web/src`.

## Global Constraints

- Only `apps/web/src/index.css` and files under `apps/web/src/**` are in scope. `packages/ui` was audited and already uses HeroUI semantics correctly — no changes needed there.
- `apps/web/src/components/reporte-pdf.tsx` is explicitly **out of scope**: it renders via `@react-pdf/renderer`, a separate engine that cannot consume Tailwind classes or CSS custom properties — its ~50 hardcoded hex values are a print-document style sheet, not a web UI theming bug. Flagged for the user, not scheduled here.
- DESIGN.md defines no error/danger red. The existing `--danger: oklch(0.65 0.2 30)` is kept as-is (this is an assumption — flag to a designer if an exact brand red is wanted).
- No visual regression on the one deliberate non-standard pattern already in the codebase: the `RiesgoBadge` "CRITICO" state uses an inverted Bone-fill/Void-text badge instead of a red one. That pattern is preserved (renamed, not restyled) — DESIGN.md explicitly allows "invert only" as the sole way to combine a bright fill with text.
- Every task's edits are Tailwind class renames or CSS var value changes only — no component logic changes.

---

## Findings driving this plan (context for every task below)

1. **Primitive/semantic name collision with DESIGN.md.** `index.css` currently names its raw palette after the *old* Supabase-green theme (`obsidian, ash, charcoal, slate, graphite, smoke, silver, snow, green, green-deep, green-mid, green-midnight`) while carrying *new* violet values. Worse, its `ash` (`#000000`, a black card surface) collides with DESIGN.md's `Ash` (`#bdbdbd`, secondary text) — same name, different color, different role.
2. **Components bypass HeroUI's semantic layer entirely.** ~150 occurrences across 18 files in `apps/web/src` use the raw primitive utilities (`bg-obsidian`, `text-snow`, `border-charcoal`, `bg-ash`, `text-smoke`, `text-silver`, `bg-green`, `text-green`, `border-slate`) instead of the semantic ones (`bg-background`, `text-foreground`, `border-border`, `bg-surface`, `text-muted`, `bg-accent`, `text-link`, `text-success`, `border-field-border`). `packages/ui` has zero such occurrences — this is a web-app-only regression.
3. **Real contrast bug: black text on violet buttons.** Every primary CTA button and the sidebar logo chip does `bg-green ... text-obsidian` (violet background, **black** text). DESIGN.md's Primary Action Button spec explicitly requires *Bone (white)* text on Plum Voltage. `index.css` already defines `--accent-foreground: var(--color-snow)` (white) correctly — components just never use it, using `text-obsidian` instead. This is a leftover from the old light-mint-green theme (which needed dark text) never updated for the new violet accent (which needs light text).
4. **Real semantic bug: status badges lost their color coding.** `EstadoBadge`'s `COMPLETADO` and `RiesgoBadge`'s `BAJO` (low risk) states render `bg-green/10 text-green border-green/30`. Before the rebrand this was genuinely green (success). After the rebrand, "green" was repointed to violet in place, so these now render **violet**, not green — a completed study and a low-risk finding no longer look "safe/good" at a glance. `index.css` already defines `--success: #15846e` (Lichen, actual green) correctly; the badges just never reference it.
5. **Wrong accent for inline text links.** DESIGN.md assigns "linked labels" to Amber Spark, and `index.css` already sets `--link: var(--color-green-mid)` (amber) correctly. But every inline "Ver más →"-style link in the app uses `text-green` (violet, the CTA-only color) with `hover:underline`, not `text-link`.
6. **Leftover old-theme hex in inline SVG.** `mri-viewer.tsx` draws finding bounding boxes with hardcoded `"#3ecf8e"` (the *old* Supabase teal-green) and a matching `rgba(62,207,142,0.6)` glow — both untouched by the violet rebrand. `analisis/$estudioId.tsx`'s "Informe Clínico de IA" pulse dot has the same leftover `rgba(62,207,142,0.6)` shadow.
7. **Un-themed default-Tailwind colors.** `sign-in-form.tsx` / `sign-up-form.tsx` use raw `text-red-500` and `text-indigo-600 hover:text-indigo-800` — colors from Tailwind's default palette, completely disconnected from the Dala theme.

---

## Global Token Rename Map

Apply these renames wherever the *old* token is used for the stated purpose. Word-boundary rename (e.g. `bg-green` → `bg-accent`, `hover:bg-green` → `hover:bg-accent`, `border-green/30` → `border-accent/30`), not literal string replacement of whole `className` blocks.

| Old utility | New utility | When |
|---|---|---|
| `bg-obsidian`, `border-obsidian` | `bg-background` / `border-background` | Full-page / sidebar / drawer canvas |
| `bg-obsidian` (boxed panel/frame) | `bg-surface` | Cards, modal inner boxes, image viewer frame, role-chip background |
| `border-charcoal` | `border-border` | All hairline borders |
| `border-slate` | `border-field-border` | Form field borders (inputs, textareas) |
| `text-snow` | `text-foreground` | Primary text |
| `text-smoke` | `text-muted` | Tertiary/caption text, disabled spinner border |
| `text-silver` | `text-ash` | Secondary text (primitive renamed `silver`→`ash`, see Task 1) |
| `bg-green` (filled buttons/chips/dots) | `bg-accent` | Primary CTA fill |
| `hover:bg-green-deep` | `hover:bg-accent-hover` | Button hover |
| `text-obsidian` (on a `bg-accent`/`bg-green` element) | `text-accent-foreground` | **Contrast fix — see Finding 3** |
| `text-green` (brand emphasis in headings/labels, not a link, not a status) | `text-accent` | Decorative violet emphasis, no visual change |
| `text-green ... hover:underline`, `prose-a:text-green` | `text-link ... hover:underline`, `prose-a:text-link` | **Link color fix — see Finding 5** |
| `text-green` (denotes success/ready/available state) | `text-success` | **Status color fix — see Finding 4** |
| `bg-green/10 text-green border-green/30` (success-meaning badge) | `bg-success/10 text-success border-success/30` | **Status color fix — see Finding 4** |
| `bg-ash` | `bg-surface` | Panel/card fill |
| `hover:bg-ash` | `hover:bg-surface-hover` (nav rows) or `hover:bg-default-hover` (buttons on `bg-background`) | context-dependent, see per-file tasks |
| `bg-slate/40`, `bg-slate` (loading/neutral wash, not a border) | `bg-muted/15` (badge wash) or `bg-muted/20` (skeleton pulse) | Neutral grey fill that must stay visible against black |
| `text-red-500` | `text-danger` | Form field errors |
| `text-indigo-600 hover:text-indigo-800` | `text-link` | Inline text-button links |

---

## Task 1: Rewrite `apps/web/src/index.css`

**Files:**
- Modify: `apps/web/src/index.css:9-128`

- [ ] **Step 1: Replace the `@theme` block (lines 9-59) with DESIGN.md-named primitives**

```css
@theme {
  /* Colors — named and valued per DESIGN.md "Dala" system */
  --color-void: #000000;          /* Void — page canvas, all surfaces (no nested tiers) */
  --color-bone: #ffffff;          /* Bone — primary text, hairlines, inverted fills */
  --color-ash: #bdbdbd;           /* Ash — secondary text */
  --color-smoke: #9a9a9a;         /* Smoke — tertiary/caption text */
  --color-plum-voltage: #8052ff;  /* Plum Voltage — primary CTA / accent */
  --color-amber-spark: #ffb829;   /* Amber Spark — links / inline accent */
  --color-lichen: #15846e;        /* Lichen — success status */
  /* Graphite is a UI-only derived grey (not a DESIGN.md swatch) for de-emphasized
     numerals/icon strokes — kept close to the old #4d4d4d but sourced from Bone/Void
     so it can never drift from the two true primitives. */
  --color-graphite: color-mix(in oklab, var(--color-bone) 30%, var(--color-void));

  /* Typography */
  --font-sans: "Inter Variable", ui-sans-serif, system-ui, -apple-system, sans-serif;
  --font-mono: "Geist Mono Variable", ui-monospace, monospace;

  /* Type scale */
  --text-caption: 12px;
  --text-caption--line-height: 1.5;
  --text-caption--letter-spacing: 0.05em;
  --text-body-sm: 14px;
  --text-body-sm--line-height: 1.5;
  --text-body-sm--letter-spacing: 0.05em;
  --text-subheading: 18px;
  --text-subheading--line-height: 1.5;
  --text-subheading--letter-spacing: 0.025em;
  --text-heading-sm: 24px;
  --text-heading-sm--line-height: 1.3;
  --text-heading-sm--letter-spacing: 0.021em;
  --text-heading: 36px;
  --text-heading--line-height: 1.2;
  --text-heading--letter-spacing: 0.021em;
  --text-heading-lg: 48px;
  --text-heading-lg--line-height: 1.1;
  --text-heading-lg--letter-spacing: -0.04em;
  --text-display: 78px;
  --text-display--line-height: 0.9;
  --text-display--letter-spacing: -0.04em;
  --text-hero: 113px;
  --text-hero--line-height: 0.81;
  --text-hero--letter-spacing: -0.04em;

  /* Radius — every interactive surface uses 24px per DESIGN.md */
  --radius-input: 1.5rem;
  --radius-card: 1.5rem;
  --radius-nav: 1.5rem;
  --radius-full: 9999px;
}
```

- [ ] **Step 2: Replace the HeroUI semantic override block (lines 63-128) with**

```css
/* ─── HeroUI v3 Semantic Token Overrides — forced dark ───────────────────── */
:root {
  /* Accent → Plum Voltage */
  --accent: var(--color-plum-voltage);
  --accent-foreground: var(--color-bone);
  /* Darker-on-hover (not HeroUI's default lighten) to match this system's existing,
     intentional "pressed" feel — derived from the accent itself, not a hand-picked hex. */
  --accent-hover: color-mix(in oklab, var(--color-plum-voltage) 80%, black 20%);

  /* Canvas */
  --background: var(--color-void);

  /* Surfaces — flat, no elevation tier (spec: "no nested surface layers") */
  --surface: var(--color-void);
  --surface-foreground: var(--color-bone);
  --surface-secondary: color-mix(in oklab, var(--color-bone) 4%, var(--color-void));
  --surface-tertiary: color-mix(in oklab, var(--color-bone) 8%, var(--color-void));

  /* Overlay (modals, dropdowns) */
  --overlay: var(--color-void);
  --overlay-foreground: var(--color-bone);

  /* Default component fill */
  --default: var(--color-void);
  --default-foreground: var(--color-bone);

  /* Foreground */
  --foreground: var(--color-bone);
  --muted: var(--color-smoke);

  /* Borders — DESIGN.md: "1px solid #ffffff at low alpha" (hairline), ~16% for fields */
  --border: color-mix(in oklab, var(--color-bone) 10%, transparent);
  --separator: var(--border);

  /* Form fields */
  --field-background: var(--color-void);
  --field-foreground: var(--color-bone);
  --field-placeholder: var(--color-smoke);
  --field-border: color-mix(in oklab, var(--color-bone) 16%, transparent);
  --field-border-width: 1px;

  /* Focus → Plum Voltage (no glow ring — just chromatic border) */
  --focus: var(--color-plum-voltage);

  /* Base radius → 24px, matches every interactive surface per DESIGN.md */
  --radius: 1.5rem;

  /* Flat design — no shadows */
  --surface-shadow: none;
  --overlay-shadow: none;
  --field-shadow: none;

  /* Segment / tabs */
  --segment: var(--color-void);
  --segment-foreground: var(--color-bone);

  /* Link → Amber Spark */
  --link: var(--color-amber-spark);

  /* Status colors */
  --success: var(--color-lichen);
  --success-foreground: var(--color-bone);
  --warning: var(--color-amber-spark);
  --warning-foreground: var(--color-void);
  /* DESIGN.md defines no error red — kept as a reasonable functional default.
     Confirm with design if an exact brand red is wanted. */
  --danger: oklch(0.65 0.2 30);
  --danger-foreground: var(--color-bone);
}
```

Note what got *removed* on purpose: the hand-picked `--accent-soft` / `--accent-soft-foreground` (`green-midnight`/`green`) override. HeroUI's own calculated formula (`color-mix(in oklab, var(--accent) 15%, transparent)`) now applies automatically and produces an equivalent violet-tinted wash without a separately maintained hex value. Same for every other `-hover`/`-soft` token not listed above (`danger-hover`, `success-soft`, `warning-hover`, `background-secondary`, `border-secondary`, `field-hover`, etc.) — they all recompute correctly off the primitives above because `var()` references resolve against the current cascade, not the value at definition time.

- [ ] **Step 3: Leave the Base and Utilities sections (old lines 130-153) unchanged.**

- [ ] **Step 4: Verify the file parses and the dev server starts clean**

```bash
turbo -F web dev
```
Expected: Vite starts with no CSS/Tailwind errors. Stop the server after confirming.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/index.css
git commit -m "style(web): rename theme primitives to DESIGN.md names, derive borders from Bone"
```

---

## Task 2: `components/estado-badge.tsx` and `components/riesgo-badge.tsx`

**Files:**
- Modify: `apps/web/src/components/estado-badge.tsx:3-7`
- Modify: `apps/web/src/components/riesgo-badge.tsx:3-8`

- [ ] **Step 1: Fix `estado-badge.tsx` STYLES map (Finding 2 & 4)**

```ts
const STYLES: Record<string, string> = {
  PENDIENTE:    "bg-surface text-muted border-border",
  EN_ANALISIS:  "bg-muted/15 text-ash border-transparent",
  COMPLETADO:   "bg-success/10 text-success border-success/30",
};
```

Also update the fallback on line 16: `"bg-ash text-smoke border-charcoal"` → `"bg-surface text-muted border-border"`.

- [ ] **Step 2: Fix `riesgo-badge.tsx` STYLES map (Finding 2 & 4, preserves the inverted CRITICO pattern)**

```ts
const STYLES: Record<string, string> = {
  NO_EVALUADO: "bg-surface text-muted border-border",
  BAJO:        "bg-success/10 text-success border-success/30",
  MODERADO:    "bg-muted/15 text-ash border-transparent",
  CRITICO:     "bg-bone text-void border-transparent",
};
```

Also update the fallback on line 18 the same way as Step 1.

- [ ] **Step 3: Verify no legacy tokens remain**

```bash
grep -nE "bg-ash|text-smoke|border-charcoal|bg-slate|text-silver|text-green|bg-snow|text-obsidian" apps/web/src/components/estado-badge.tsx apps/web/src/components/riesgo-badge.tsx
```
Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/estado-badge.tsx apps/web/src/components/riesgo-badge.tsx
git commit -m "fix(web): restore success-green color coding on status/risk badges"
```

---

## Task 3: `components/mri-viewer.tsx`

**Files:**
- Modify: `apps/web/src/components/mri-viewer.tsx:35,56,61,72,76,80,86`

- [ ] **Step 1: Fix the leftover old-theme SVG colors (Finding 6) — line 56**

```tsx
const stroke = h.es_critico ? "var(--color-bone)" : "var(--color-graphite)";
```

- [ ] **Step 2: Fix the label-text contrast to match — line 61**

```tsx
<text x={x + 3} y={y - 4} fill={h.es_critico ? "var(--color-void)" : "var(--color-bone)"} fontSize={10} fontFamily="Geist Variable, monospace">
```

- [ ] **Step 3: Apply the Global Token Rename Map to the remaining classNames**

| Line | Old | New |
|---|---|---|
| 35 | `border border-charcoal rounded-2xl overflow-hidden bg-obsidian` | `border border-border rounded-2xl overflow-hidden bg-surface` |
| 72 | `bg-obsidian/80 backdrop-blur-md px-4 py-2 rounded-full border border-charcoal` | `bg-background/80 backdrop-blur-md px-4 py-2 rounded-full border border-border` |
| 76, 86 | `text-snow disabled:text-smoke hover:text-green transition-colors disabled:pointer-events-none p-1` | `text-foreground disabled:text-muted hover:text-accent transition-colors disabled:pointer-events-none p-1` |
| 80 | `text-[12px] font-medium text-silver tabular-nums tracking-widest` | `text-[12px] font-medium text-ash tabular-nums tracking-widest` |
| 81 | `text-smoke` | `text-muted` |

- [ ] **Step 4: Verify**

```bash
grep -nE "#[0-9a-fA-F]{3,6}|bg-obsidian|text-snow|text-smoke|text-silver|border-charcoal|hover:text-green" apps/web/src/components/mri-viewer.tsx
```
Expected: no output.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/mri-viewer.tsx
git commit -m "fix(web): replace leftover old-theme teal-green MRI marker colors with Dala tokens"
```

---

## Task 4: `components/page-header.tsx`, `components/patient-card.tsx`, `components/stat-card.tsx`

**Files:**
- Modify: `apps/web/src/components/page-header.tsx:11-12`
- Modify: `apps/web/src/components/patient-card.tsx:5-17`
- Modify: `apps/web/src/components/stat-card.tsx:9-14`

- [ ] **Step 1: `page-header.tsx`**

| Line | Old | New |
|---|---|---|
| 11 | `text-[18px] font-normal text-snow tracking-[-0.3px]` | `text-[18px] font-normal text-foreground tracking-[-0.3px]` |
| 12 | `mt-1 text-[13px] text-smoke` | `mt-1 text-[13px] text-muted` |

- [ ] **Step 2: `patient-card.tsx`**

| Line | Old | New |
|---|---|---|
| 5 | `rounded-2xl border border-charcoal bg-ash p-5` | `rounded-2xl border border-border bg-surface p-5` |
| 6 | `text-[11px] font-medium text-smoke uppercase tracking-widest mb-3` | `text-[11px] font-medium text-muted uppercase tracking-widest mb-3` |
| 7 | `text-[17px] font-normal text-snow mb-3` | `text-[17px] font-normal text-foreground mb-3` |
| 12, 16 | `text-[11px] text-smoke mb-0.5` | `text-[11px] text-muted mb-0.5` |
| 13, 17 | `text-[13px] font-medium text-silver` | `text-[13px] font-medium text-ash` |

- [ ] **Step 3: `stat-card.tsx`**

| Line | Old | New |
|---|---|---|
| 9 | `rounded-2xl border border-charcoal bg-ash p-5` | `rounded-2xl border border-border bg-surface p-5` |
| 10 | `text-[12px] text-smoke mb-2` | `text-[12px] text-muted mb-2` |
| 12 | `h-8 w-12 rounded bg-slate animate-pulse` | `h-8 w-12 rounded bg-muted/20 animate-pulse` |
| 14 | `text-[32px] font-normal text-snow leading-none tracking-tight` | `text-[32px] font-normal text-foreground leading-none tracking-tight` |

- [ ] **Step 4: Verify**

```bash
grep -nE "bg-ash|text-smoke|border-charcoal|bg-slate|text-silver|text-snow" apps/web/src/components/page-header.tsx apps/web/src/components/patient-card.tsx apps/web/src/components/stat-card.tsx
```
Expected: no output.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/page-header.tsx apps/web/src/components/patient-card.tsx apps/web/src/components/stat-card.tsx
git commit -m "style(web): use HeroUI semantic color utilities in card/header components"
```

---

## Task 5: `components/estudio-detail-modal.tsx`

**Files:**
- Modify: `apps/web/src/components/estudio-detail-modal.tsx:111-239`

- [ ] **Step 1: Apply the Global Token Rename Map**

| Line | Old | New |
|---|---|---|
| 111 | `bg-obsidian border border-charcoal w-full h-full max-w-full m-0 rounded-none sm:rounded-none` | `bg-background border border-border w-full h-full max-w-full m-0 rounded-none sm:rounded-none` |
| 112 | `flex flex-col gap-1 border-b border-charcoal text-snow px-4 sm:px-8 py-6` | `flex flex-col gap-1 border-b border-border text-foreground px-4 sm:px-8 py-6` |
| 114 | `text-[20px] font-medium text-snow` | `text-[20px] font-medium text-foreground` |
| 120 | `text-[13px] text-smoke hover:text-silver transition-colors` | `text-[13px] text-muted hover:text-ash transition-colors` |
| 129, 131, 144 | `text-[13px] text-smoke` | `text-[13px] text-muted` |
| 136 | `rounded-2xl border border-charcoal overflow-hidden bg-ash flex items-center justify-center min-h-[400px]` | `rounded-2xl border border-border overflow-hidden bg-surface flex items-center justify-center min-h-[400px]` |
| 154 | `rounded-full bg-green px-6 py-2.5 text-[14px] font-medium text-obsidian hover:bg-green-deep disabled:opacity-50 transition-colors w-full sm:w-auto text-center` | `rounded-full bg-accent px-6 py-2.5 text-[14px] font-medium text-accent-foreground hover:bg-accent-hover disabled:opacity-50 transition-colors w-full sm:w-auto text-center` |
| 166, 181 | `rounded-full border border-charcoal px-6 py-2.5 text-[14px] text-snow hover:bg-ash hover:border-slate transition-colors w-full sm:w-auto text-center` (166) / `... text-center inline-block w-full sm:w-auto` (181) | same, with `border-charcoal`→`border-border`, `text-snow`→`text-foreground`, `hover:bg-ash`→`hover:bg-surface-hover`, `hover:border-slate`→`hover:border-field-border` |
| 192 | `rounded-full border border-charcoal/50 px-6 py-2.5 text-[14px] text-smoke cursor-not-allowed transition-colors w-full sm:w-auto text-center` | `rounded-full border border-border/50 px-6 py-2.5 text-[14px] text-muted cursor-not-allowed transition-colors w-full sm:w-auto text-center` |
| 205 | `rounded-2xl border border-charcoal bg-ash p-5` | `rounded-2xl border border-border bg-surface p-5` |
| 206 | `text-[11px] font-medium text-smoke uppercase tracking-widest mb-4` | `text-[11px] font-medium text-muted uppercase tracking-widest mb-4` |
| 239 | `text-[12px] text-smoke shrink-0` | `text-[12px] text-muted shrink-0` |

- [ ] **Step 2: Fix the "Disponible" status text (Finding 4/5 — this is a success state, not a link or CTA) — line 217**

```tsx
value={
  reporte.estado === "LISTO" ? <span className="text-success">Disponible</span>
  : reporte.estado === "GENERANDO" ? "Generando…"
  : "Error"
}
```

- [ ] **Step 3: Verify**

```bash
grep -nE "bg-ash|text-smoke|border-charcoal|border-slate|text-silver|text-snow|bg-green|text-green|text-obsidian" apps/web/src/components/estudio-detail-modal.tsx
```
Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/estudio-detail-modal.tsx
git commit -m "fix(web): use HeroUI semantic colors in estudio detail modal, fix button text contrast"
```

---

## Task 6: `components/nuevo-estudio-modal.tsx`

**Files:**
- Modify: `apps/web/src/components/nuevo-estudio-modal.tsx:95-296`

- [ ] **Step 1: Apply the Global Token Rename Map**

| Line(s) | Old | New |
|---|---|---|
| 95 | `bg-ash border border-charcoal sm:max-w-2xl w-full` | `bg-surface border border-border sm:max-w-2xl w-full` |
| 97 | `flex flex-col gap-1 text-snow` | `flex flex-col gap-1 text-foreground` |
| 117 | `text-charcoal mx-1` | `text-border mx-1` |
| 126, 234 | `rounded-2xl border border-charcoal bg-obsidian p-6 mt-2` / `... p-6` | `border-border`, `bg-background` |
| 127, 235 | `text-[14px] text-snow mb-4` | `text-[14px] text-foreground mb-4` |
| 131, 169, 178, 188, 197, 261 | `text-[13px] text-silver ...` | `text-[13px] text-ash ...` |
| 138 | `flex-1 rounded-lg border border-slate bg-ash px-3 py-2 text-[14px] text-snow placeholder:text-smoke focus:outline-none focus:border-green transition-colors` | `flex-1 rounded-lg border border-field-border bg-surface px-3 py-2 text-[14px] text-foreground placeholder:text-muted focus:outline-none focus:border-accent transition-colors` |
| 142 | `rounded-full border border-charcoal px-4 text-[13px] text-snow hover:bg-ash hover:border-slate transition-colors whitespace-nowrap` | `border-border`, `text-foreground`, `hover:bg-surface-hover`, `hover:border-field-border` |
| 148, 219, 254, 262 | `text-smoke` (as caption/error text) | `text-muted` |
| 153 | `text-green font-medium hover:underline` | `text-link font-medium hover:underline` |
| 170, 179, 189, 198 | `bg-ash border-slate` | `bg-surface border-field-border` |
| 210, 296 | `rounded-full bg-green px-5 py-2 text-[13px] font-medium text-obsidian hover:bg-green-deep disabled:opacity-50 transition-colors` (and the `px-5 py-2 text-[14px] ... w-full sm:w-auto text-center` variant at 296) | `bg-accent`, `text-accent-foreground`, `hover:bg-accent-hover` |
| 219 | `text-[13px] text-smoke hover:text-silver transition-colors` | `text-[13px] text-muted hover:text-ash transition-colors` |
| 253 | `text-[13px] font-medium text-snow` | `text-[13px] font-medium text-foreground` |
| 277, 287 | `rounded-full border border-charcoal px-5 py-2 text-[14px] text-snow hover:bg-obsidian hover:border-slate transition-colors w-full sm:w-auto text-center` | `border-border`, `text-foreground`, `hover:bg-background`, `hover:border-field-border` |

- [ ] **Step 2: Verify**

```bash
grep -nE "bg-ash|text-smoke|border-charcoal|border-slate|text-silver|text-snow|bg-green|text-green|text-obsidian|text-charcoal" apps/web/src/components/nuevo-estudio-modal.tsx
```
Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/nuevo-estudio-modal.tsx
git commit -m "fix(web): use HeroUI semantic colors in nuevo estudio modal, fix button text contrast and link color"
```

---

## Task 7: `components/nuevo-paciente-modal.tsx`

**Files:**
- Modify: `apps/web/src/components/nuevo-paciente-modal.tsx:46-189`

- [ ] **Step 1: Apply the Global Token Rename Map**

| Line | Old | New |
|---|---|---|
| 46 | `bg-ash border border-charcoal sm:max-w-2xl w-full` | `bg-surface border border-border sm:max-w-2xl w-full` |
| 48 | `flex flex-col gap-1 text-snow` | `flex flex-col gap-1 text-foreground` |
| 50 | `text-[13px] text-smoke font-normal mt-1` | `text-[13px] text-muted font-normal mt-1` |
| 69, 86, 105 | `text-[13px] text-silver mb-1.5` | `text-[13px] text-ash mb-1.5` |
| 70, 87, 106, 123, 165 | `bg-obsidian border-slate` / `bg-obsidian border-charcoal h-full` | `bg-background border-field-border` (123 keeps `border-border` since it's `border-charcoal`, not `border-slate`) |
| 113 | `text-[13px] text-silver` | `text-[13px] text-ash` |
| 179 | `rounded-full border border-charcoal px-5 py-2 text-[14px] text-snow hover:bg-obsidian hover:border-slate transition-colors w-full sm:w-auto text-center` | `border-border`, `text-foreground`, `hover:bg-background`, `hover:border-field-border` |
| 189 | `rounded-full bg-green px-5 py-2 text-[14px] font-medium text-obsidian hover:bg-green-deep disabled:opacity-50 transition-colors w-full sm:w-auto text-center` | `bg-accent`, `text-accent-foreground`, `hover:bg-accent-hover` |

- [ ] **Step 2: Verify**

```bash
grep -nE "bg-ash|text-smoke|border-charcoal|border-slate|text-silver|text-snow|bg-green|text-obsidian" apps/web/src/components/nuevo-paciente-modal.tsx
```
Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/nuevo-paciente-modal.tsx
git commit -m "fix(web): use HeroUI semantic colors in nuevo paciente modal, fix button text contrast"
```

---

## Task 8: `components/sign-in-form.tsx` and `components/sign-up-form.tsx`

**Files:**
- Modify: `apps/web/src/components/sign-in-form.tsx:81,104,128`
- Modify: `apps/web/src/components/sign-up-form.tsx:83,106,129,153`

- [ ] **Step 1: Fix un-themed Tailwind default colors (Finding 7) in both files**

Every field-error paragraph:
```tsx
<p key={error?.message} className="text-danger">
```

The switch-mode link button (`sign-in-form.tsx:128`, `sign-up-form.tsx:153`) — drop the hardcoded hover color and let the `Button` component's own `variant="link"` styling apply:
```tsx
<Button
  variant="link"
  onClick={onSwitchToSignUp}
  className="text-link"
>
```
(and the sign-up equivalent with `onSwitchToSignIn`)

- [ ] **Step 2: Verify**

```bash
grep -nE "text-red-500|text-indigo-600|hover:text-indigo-800" apps/web/src/components/sign-in-form.tsx apps/web/src/components/sign-up-form.tsx
```
Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/sign-in-form.tsx apps/web/src/components/sign-up-form.tsx
git commit -m "fix(web): replace default-Tailwind red/indigo with Dala danger/link tokens on auth forms"
```

---

## Task 9: `routes/_app.tsx`

**Files:**
- Modify: `apps/web/src/routes/_app.tsx:62-212`

- [ ] **Step 1: Apply the Global Token Rename Map**

| Line(s) | Old | New |
|---|---|---|
| 62 | `flex flex-col lg:flex-row h-svh bg-obsidian font-sans overflow-hidden` | `bg-background` |
| 64, 158 | `... border-b border-charcoal bg-obsidian px-4 shrink-0` / `... border-r border-charcoal bg-obsidian shrink-0` | `border-border`, `bg-background` |
| 66, 97, 161 | `flex h-6 w-6 items-center justify-center rounded bg-green` | `bg-accent` |
| 67, 98, 162 | `text-obsidian` (icon inside the accent chip) | `text-accent-foreground` **(Finding 3 — contrast fix)** |
| 69, 100, 141, 164, 197 | `text-[13px] font-medium tracking-tight text-snow` / `text-[13px] font-medium text-snow truncate` | `text-foreground` |
| 76, 107 | `p-1.5 text-smoke hover:text-snow hover:bg-ash rounded-lg transition-colors` / `p-1 text-smoke hover:text-snow hover:bg-ash rounded-lg transition-colors` | `text-muted hover:text-foreground hover:bg-surface-hover` |
| 88 | `fixed inset-0 bg-obsidian/85 backdrop-blur-sm transition-opacity duration-300` | `bg-background/85` |
| 93 | `relative flex w-64 max-w-[80vw] h-full flex-col border-r border-charcoal bg-obsidian p-4 z-10 transition-transform duration-300` | `border-border`, `bg-background` |
| 95, 138, 160, 193 | `border-b border-charcoal` / `border-t border-charcoal pt-4 mt-auto` / `border-b border-charcoal` / `border-t border-charcoal p-2` | `border-border` |
| 142, 198 | `text-[12px] text-smoke truncate` | `text-muted truncate` |
| 148, 204 | `w-full rounded-lg px-3 py-2 text-[13px] text-smoke hover:bg-ash hover:text-silver text-left transition-colors` | `text-muted hover:bg-surface-hover hover:text-ash` |
| 212 | `flex-1 overflow-y-auto bg-obsidian w-full` | `bg-background` |

- [ ] **Step 2: Verify**

```bash
grep -nE "bg-obsidian|border-charcoal|bg-green|text-obsidian|text-snow|text-smoke|hover:bg-ash|hover:text-silver" apps/web/src/routes/_app.tsx
```
Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/routes/_app.tsx
git commit -m "fix(web): use HeroUI semantic colors in app shell/sidebar, fix logo chip icon contrast"
```

---

## Task 10: `routes/_app.usuarios.tsx`

**Files:**
- Modify: `apps/web/src/routes/_app.usuarios.tsx:129-337`

- [ ] **Step 1: Apply the Global Token Rename Map**

| Line | Old | New |
|---|---|---|
| 129 | `Gestión de <span className="text-green">Usuarios</span>` | `text-accent` (decorative brand emphasis — no color change) |
| 131, 332 | `text-smoke text-base` / `text-base text-smoke` | `text-muted text-base` / `text-base text-muted` |
| 145 | `border border-charcoal rounded-2xl overflow-hidden` | `border-border` |
| 158, 164 | `text-center text-smoke py-8` | `text-center text-muted py-8` |
| 174 | `inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-obsidian border border-slate text-snow` | `bg-background border-field-border text-foreground` |
| 297, 337 | `flex justify-end gap-3 mt-4 pt-4 border-t border-charcoal` | `border-border` |
| 334 | `text-snow` | `text-foreground` |

- [ ] **Step 2: Verify**

```bash
grep -nE "text-green|text-smoke|border-charcoal|bg-obsidian|border-slate|text-snow" apps/web/src/routes/_app.usuarios.tsx
```
Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/routes/_app.usuarios.tsx
git commit -m "style(web): use HeroUI semantic colors in usuarios route"
```

---

## Task 11: `routes/login.tsx` and `routes/setup.tsx`

**Files:**
- Modify: `apps/web/src/routes/login.tsx:46-101`
- Modify: `apps/web/src/routes/setup.tsx:77-162`

- [ ] **Step 1: `login.tsx`**

| Line | Old | New |
|---|---|---|
| 46 | `min-h-svh bg-obsidian flex items-center justify-center p-6` | `bg-background` |
| 49 | `text-[11px] font-medium text-smoke uppercase tracking-widest mb-3` | `text-muted` |
| 52 | `text-[22px] font-normal text-snow leading-tight tracking-[-0.3px]` | `text-foreground` |
| 57 | `rounded-2xl border border-charcoal bg-ash p-6` | `border-border bg-surface` |
| 72, 89 | `text-[13px] text-silver mb-1.5` | `text-ash` |
| 101 | `mt-1 w-full rounded-full bg-green text-obsidian font-medium text-[14px] py-2.5 disabled:opacity-50 transition-opacity` | `bg-accent text-accent-foreground` |

- [ ] **Step 2: `setup.tsx`**

| Line | Old | New |
|---|---|---|
| 77 | `min-h-svh bg-obsidian flex items-center justify-center p-6` | `bg-background` |
| 80 | `text-[11px] font-medium text-smoke uppercase tracking-widest mb-3` | `text-muted` |
| 83 | `text-[22px] font-normal text-snow leading-tight tracking-[-0.3px]` | `text-foreground` |
| 86 | `mt-2 text-[13px] text-silver leading-relaxed` | `text-ash` |
| 91 | `rounded-2xl border border-charcoal bg-ash p-6` | `border-border bg-surface` |
| 105, 122, 143 | `text-[13px] text-silver mb-1.5` | `text-ash` |
| 152 | `flex items-center gap-2 px-3 py-2 rounded-lg border border-charcoal bg-obsidian` | `border-border bg-background` |
| 153 | `text-[12px] text-smoke` | `text-muted` |
| 154 | `text-[12px] font-medium text-green` | `text-accent` (decorative role-name emphasis — no color change) |
| 162 | `mt-1 w-full rounded-full bg-green text-obsidian font-medium text-[14px] py-2.5 disabled:opacity-50 transition-opacity` | `bg-accent text-accent-foreground` |

- [ ] **Step 3: Verify**

```bash
grep -nE "bg-obsidian|text-smoke|text-snow|border-charcoal|bg-ash|text-silver|bg-green|text-obsidian" apps/web/src/routes/login.tsx apps/web/src/routes/setup.tsx
```
Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/routes/login.tsx apps/web/src/routes/setup.tsx
git commit -m "fix(web): use HeroUI semantic colors on login/setup screens, fix button text contrast"
```

---

## Task 12: `routes/_app/dashboard.tsx`

**Files:**
- Modify: `apps/web/src/routes/_app/dashboard.tsx:60-146`

- [ ] **Step 1: Apply the Global Token Rename Map**

| Line | Old | New |
|---|---|---|
| 60 | `inline-flex items-center rounded-full bg-ash px-3 py-1 text-[12px] text-smoke border border-charcoal` | `bg-surface text-muted border-border` |
| 74 | `text-[14px] text-silver` | `text-ash` |
| 78 | `text-[13px] text-smoke hover:text-silver transition-colors` | `text-muted hover:text-ash transition-colors` |
| 85, 89 | `rounded-2xl border border-charcoal p-8 text-center text-[13px] text-smoke` | `border-border ... text-muted` |
| 94, 122 | `text-green font-medium hover:underline` | `text-link font-medium hover:underline` |
| 100 | `rounded-2xl border border-charcoal overflow-hidden overflow-x-auto` | `border-border` |
| 103 | `border-b border-charcoal bg-ash` | `border-border bg-surface` |
| 104-107 | `px-4 py-3 text-left text-smoke font-normal` / `text-right text-smoke font-normal` | `text-muted` |
| 113 | `px-4 py-3 font-mono text-silver truncate max-w-[200px]` | `text-ash` |
| 117 | `px-4 py-3 text-smoke` | `text-muted` |
| 139 | `rounded-full bg-green px-5 py-2 text-[14px] font-medium text-obsidian hover:bg-green-deep transition-colors text-center w-full sm:w-auto` | `bg-accent`, `text-accent-foreground`, `hover:bg-accent-hover` |
| 146 | `rounded-full border border-charcoal px-5 py-2 text-[14px] text-snow hover:bg-ash hover:border-slate transition-colors text-center w-full sm:w-auto` | `border-border`, `text-foreground`, `hover:bg-surface-hover`, `hover:border-field-border` |

- [ ] **Step 2: Verify**

```bash
grep -nE "bg-ash|text-smoke|border-charcoal|text-silver|text-green|bg-green|text-obsidian|text-snow|border-slate" "apps/web/src/routes/_app/dashboard.tsx"
```
Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/routes/_app/dashboard.tsx
git commit -m "fix(web): use HeroUI semantic colors on dashboard, fix link and button colors"
```

---

## Task 13: `routes/_app/analisis/$estudioId.tsx`

**Files:**
- Modify: `apps/web/src/routes/_app/analisis/$estudioId.tsx:56-144`

- [ ] **Step 1: Apply the Global Token Rename Map**

| Line | Old | New |
|---|---|---|
| 56, 57 | `p-8 text-[13px] text-smoke` | `text-muted` |
| 71 | `text-[13px] text-smoke hover:text-silver transition-colors` | `text-muted hover:text-ash transition-colors` |
| 80, 84, 88 | `rounded-2xl border border-charcoal bg-ash p-5` | `border-border bg-surface` |
| 81, 89 | `text-[12px] text-smoke mb-2` | `text-muted` |
| 86 | `text-[32px] font-normal text-snow leading-none` | `text-foreground` |
| 90 | `text-[32px] font-normal leading-none ${criticos.length > 0 ? "text-green" : "text-graphite"}` | `${criticos.length > 0 ? "text-accent" : "text-graphite"}` (only `text-green`→`text-accent`; `text-graphite` is unchanged, now a derived token from Task 1) |
| 103, 117 | `rounded-2xl border border-charcoal p-8 text-center text-[14px] text-smoke bg-obsidian` | `border-border ... text-muted bg-background` |
| 107 | `rounded-2xl border border-green/30 bg-obsidian p-6 shadow-lg overflow-y-auto max-h-[calc(100vh-300px)] custom-scrollbar` | `border-accent/30 bg-background` |
| 108 | `text-[16px] text-green mb-4 flex items-center gap-2 font-medium` | `text-accent` (decorative panel-header emphasis — no color change) |
| 109 | `w-2.5 h-2.5 rounded-full bg-green animate-pulse shadow-[0_0_8px_rgba(62,207,142,0.6)]` | `bg-accent animate-pulse shadow-[0_0_8px_rgba(128,82,255,0.6)]` **(Finding 6 — leftover old-theme teal glow, fixed to violet)** |
| 112 | `prose prose-invert prose-sm max-w-none text-silver font-sans prose-headings:text-snow prose-a:text-green` | `text-ash ... prose-headings:text-foreground prose-a:text-link` **(Finding 5 — markdown links should be Amber Spark, not violet)** |
| 118 | `w-4 h-4 border-2 border-smoke border-t-transparent rounded-full animate-spin` | `border-muted` |
| 134 | `rounded-full bg-green px-5 py-2.5 text-[14px] font-medium text-obsidian hover:bg-green-deep transition-colors text-center w-full sm:w-auto inline-block` | `bg-accent`, `text-accent-foreground`, `hover:bg-accent-hover` |
| 144 | `rounded-full border border-charcoal/50 px-5 py-2.5 text-[14px] text-smoke cursor-not-allowed transition-colors text-center w-full sm:w-auto` | `border-border/50`, `text-muted` |

- [ ] **Step 2: Verify**

```bash
grep -nE "bg-ash|text-smoke|border-charcoal|text-silver|text-snow|bg-green|text-obsidian|rgba\(62,207,142" "apps/web/src/routes/_app/analisis/\$estudioId.tsx"
```
Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add "apps/web/src/routes/_app/analisis/\$estudioId.tsx"
git commit -m "fix(web): use HeroUI semantic colors on analisis route, fix leftover teal glow and markdown link color"
```

---

## Task 14: `routes/_app/estudios/index.tsx` and `routes/_app/estudios/$estudioId.tsx`

**Files:**
- Modify: `apps/web/src/routes/_app/estudios/index.tsx:55-107`
- Modify: `apps/web/src/routes/_app/estudios/$estudioId.tsx:102-236`

- [ ] **Step 1: `estudios/index.tsx`**

| Line | Old | New |
|---|---|---|
| 55, 76 | `rounded-full bg-green px-4/5 py-2 text-[13px]/[14px] font-medium text-obsidian hover:bg-green-deep transition-colors` | `bg-accent`, `text-accent-foreground`, `hover:bg-accent-hover` |
| 64, 69 | `rounded-2xl border border-charcoal p-8/12 text-center text-[13px] text-smoke` | `border-border ... text-muted` |
| 69 (no text color, container only) | `rounded-2xl border border-charcoal p-12 text-center` | `border-border` |
| 70 | `text-[13px] text-snow mb-2` | `text-foreground` |
| 70b | `text-[13px] text-smoke mb-6` | `text-muted` |
| 82 | `rounded-2xl border border-charcoal overflow-hidden overflow-x-auto` | `border-border` |
| 85 | `border-b border-charcoal bg-ash` | `border-border bg-surface` |
| 86-90 | `px-4 py-3 text-left/right text-smoke font-normal` | `text-muted` |
| 96 | `px-4 py-3 font-mono text-smoke` | `text-muted` |
| 97 | `px-4 py-3 text-snow` | `text-foreground` |
| 99 | `px-4 py-3 text-smoke` | `text-muted` |
| 107 | `text-green font-medium hover:underline` | `text-link font-medium hover:underline` |

- [ ] **Step 2: `estudios/$estudioId.tsx`**

| Line | Old | New |
|---|---|---|
| 102, 103 | `p-8 text-[13px] text-smoke` | `text-muted` |
| 117 | `bg-obsidian border-charcoal w-full h-full max-w-none m-0 rounded-none` | `bg-background border-border` |
| 118 | `flex flex-col gap-1 border-b border-charcoal pb-4` | `border-border` |
| 120 | `text-[20px] font-medium text-snow` | `text-foreground` |
| 126 | `text-[13px] text-smoke hover:text-silver transition-colors` | `text-muted hover:text-ash transition-colors` |
| 137 | `rounded-2xl border border-charcoal overflow-hidden bg-ash flex items-center justify-center min-h-[320px]` | `border-border bg-surface` |
| 145 | `text-[13px] text-smoke` | `text-muted` |
| 155 | `rounded-full bg-green px-5 py-2 text-[14px] font-medium text-obsidian hover:bg-green-deep disabled:opacity-50 transition-colors w-full sm:w-auto text-center` | `bg-accent`, `text-accent-foreground`, `hover:bg-accent-hover` |
| 164, 179 | `rounded-full border border-charcoal px-5 py-2 text-[14px] text-snow hover:bg-ash hover:border-slate transition-colors ...` | `border-border`, `text-foreground`, `hover:bg-surface-hover`, `hover:border-field-border` |
| 190 | `rounded-full border border-charcoal/50 px-5 py-2 text-[14px] text-smoke cursor-not-allowed transition-colors w-full sm:w-auto text-center` | `border-border/50`, `text-muted` |
| 203 | `rounded-2xl border border-charcoal bg-ash p-4` | `border-border bg-surface` |
| 204 | `text-[11px] font-medium text-smoke uppercase tracking-widest mb-3` | `text-muted` |
| 236 | `text-[12px] text-smoke shrink-0` | `text-muted` |

- [ ] **Step 3: Verify**

```bash
grep -nE "bg-ash|text-smoke|border-charcoal|text-silver|text-snow|bg-green|text-obsidian|border-slate|text-green" "apps/web/src/routes/_app/estudios/index.tsx" "apps/web/src/routes/_app/estudios/\$estudioId.tsx"
```
Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add "apps/web/src/routes/_app/estudios/index.tsx" "apps/web/src/routes/_app/estudios/\$estudioId.tsx"
git commit -m "fix(web): use HeroUI semantic colors on estudios routes, fix button text contrast and link color"
```

---

## Task 15: `routes/_app/pacientes/index.tsx` and `routes/_app/pacientes/$pacienteId.tsx`

**Files:**
- Modify: `apps/web/src/routes/_app/pacientes/index.tsx:50-111`
- Modify: `apps/web/src/routes/_app/pacientes/$pacienteId.tsx:41-103`

- [ ] **Step 1: `pacientes/index.tsx`**

| Line | Old | New |
|---|---|---|
| 50, 81 | `rounded-full bg-green px-4/5 py-2 text-[13px]/[14px] font-medium text-obsidian hover:bg-green-deep transition-colors` | `bg-accent`, `text-accent-foreground`, `hover:bg-accent-hover` |
| 63 | `w-full rounded-xl border border-charcoal bg-ash px-4 py-2.5 text-[13px] text-snow placeholder:text-smoke outline-none focus:border-slate transition-colors` | `border-border bg-surface text-foreground placeholder:text-muted focus:border-field-border` |
| 69, 87 | `rounded-2xl border border-charcoal p-8 text-center text-[13px] text-smoke` | `border-border ... text-muted` |
| 73 | `rounded-2xl border border-charcoal p-12 text-center` | `border-border` |
| 74 | `text-[14px] text-snow mb-2` | `text-foreground` |
| 75 | `text-[13px] text-smoke mb-6` | `text-muted` |
| 91 | `rounded-2xl border border-charcoal overflow-hidden` | `border-border` |
| 94 | `border-b border-charcoal bg-ash` | `border-border bg-surface` |
| 95-98 | `px-4 py-3 text-left/right text-smoke font-normal` | `text-muted` |
| 104 | `px-4 py-3 text-snow` | `text-foreground` |
| 105, 106 | `px-4 py-3 font-mono text-smoke` / `px-4 py-3 text-smoke` | `text-muted` |
| 111 | `text-green font-medium hover:underline` | `text-link font-medium hover:underline` |

- [ ] **Step 2: `pacientes/$pacienteId.tsx`**

| Line | Old | New |
|---|---|---|
| 41, 42 | `p-8 text-[13px] text-smoke` | `text-muted` |
| 53 | `rounded-full bg-green px-4 py-2 text-[13px] font-medium text-obsidian hover:bg-green-deep transition-colors` | `bg-accent`, `text-accent-foreground`, `hover:bg-accent-hover` |
| 60 | `text-[13px] text-smoke hover:text-silver transition-colors` | `text-muted hover:text-ash transition-colors` |
| 73 | `text-[14px] text-silver mb-4` | `text-ash mb-4` |
| 76 | `rounded-2xl border border-charcoal p-8 text-center text-[13px] text-smoke` | `border-border ... text-muted` |
| 80 | `rounded-2xl border border-charcoal overflow-hidden` | `border-border` |
| 83 | `border-b border-charcoal bg-ash` | `border-border bg-surface` |
| 84-87 | `px-4 py-3 text-left/right text-smoke font-normal` | `text-muted` |
| 93, 95 | `px-4 py-3 font-mono text-smoke` / `px-4 py-3 text-smoke` | `text-muted` |
| 103 | `text-green font-medium hover:underline` | `text-link font-medium hover:underline` |

- [ ] **Step 3: Verify**

```bash
grep -nE "bg-ash|text-smoke|border-charcoal|text-silver|text-snow|bg-green|text-obsidian|border-slate|text-green" "apps/web/src/routes/_app/pacientes/index.tsx" "apps/web/src/routes/_app/pacientes/\$pacienteId.tsx"
```
Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add "apps/web/src/routes/_app/pacientes/index.tsx" "apps/web/src/routes/_app/pacientes/\$pacienteId.tsx"
git commit -m "fix(web): use HeroUI semantic colors on pacientes routes, fix button text contrast and link color"
```

---

## Task 16: Final verification sweep

**Files:** none (verification only)

- [ ] **Step 1: Confirm no legacy primitive names or default-Tailwind palette colors remain anywhere in `apps/web/src`**

```bash
cd apps/web/src
grep -rnE "\b(bg|text|border|hover:bg|hover:text|hover:border|focus:border|placeholder:text)-(obsidian|charcoal|slate|silver|snow)\b" --include="*.tsx" .
grep -rnE "\b(bg|text|border)-(red|blue|yellow|purple|pink|indigo|gray|grey|zinc|neutral|stone|orange|lime|emerald|teal|cyan|sky|violet|fuchsia|rose)-[0-9]{2,3}\b" --include="*.tsx" .
```
Expected: no output from either command (component-authored files only — `reporte-pdf.tsx` is excluded from scope per the Global Constraints and will still show hardcoded hex, which is expected).

- [ ] **Step 2: Confirm `text-green`/`bg-green` are gone (fully replaced by `accent`/`link`/`success`)**

```bash
grep -rnE "\b(bg|text|border|hover:bg|hover:text)-green(-deep|-mid|-midnight)?\b" --include="*.tsx" .
```
Expected: no output.

- [ ] **Step 3: Type-check and build the web app**

```bash
cd /home/indroic/Documentos/medical-system
turbo -F web check-types
```
Expected: exits 0, no TypeScript or Vite/Tailwind errors.

- [ ] **Step 4: Manual visual QA**

```bash
turbo -F web dev
```
Open the dev server and check, against DESIGN.md: login, setup, dashboard, pacientes (list + detail), estudios (list + detail + análisis with an AI report), usuarios. Confirm:
- Every filled violet button now shows **white** text (was black).
- `EstadoBadge`/`RiesgoBadge` "Completado"/"Bajo riesgo" now render **green**, not violet.
- Inline "Ver más →"-style links render **amber**, not violet.
- MRI viewer critical-finding boxes render in **white** (bone), not the old teal-green.

- [ ] **Step 5: Report to the user that `reporte-pdf.tsx` was intentionally left untouched**, and ask whether its ~50 hardcoded hex values (a separate `@react-pdf/renderer` stylesheet, unrelated to the Tailwind/HeroUI theme) should be extracted into a shared color-constants file as a follow-up.

---

## Self-Review

- **Spec coverage:** DESIGN.md's palette (Void/Bone/Ash/Smoke/Plum Voltage/Amber Spark/Lichen), border/radius rules, button contrast rule, and link-color role are all covered by Tasks 1 (tokens) and 2-15 (application). The "no shadows/gradients" and "24px radius everywhere" rules were already correctly implemented pre-plan and are left untouched.
- **Placeholder scan:** every table cell above names an exact file, line, old string, and new string — no "similar to Task N" shortcuts.
- **Type consistency:** every semantic utility used across tasks (`bg-background`, `bg-surface`, `text-foreground`, `text-muted`, `text-ash`, `bg-accent`, `text-accent-foreground`, `hover:bg-accent-hover`, `text-link`, `text-success`, `border-border`, `border-field-border`, `bg-bone`, `text-void`, `text-graphite`) is defined either directly by a `--color-*` primitive in Task 1's `@theme` block or by a HeroUI semantic var in Task 1's `:root` block (cross-checked against `@heroui/styles`' `themes/shared/theme.css`, which confirms all of them are exposed as real Tailwind utilities) — no task references an undefined token.
