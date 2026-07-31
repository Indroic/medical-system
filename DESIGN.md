---
name: MedImaging
description: A calm, colorful clinical workspace for CT-scan triage — color with purpose, not decoration.
colors:
  # Note: values are OKLCH, not hex. This project follows an OKLCH-only doctrine
  # (see general design rules); Stitch's linter will warn on non-hex but this is
  # the canonical, normative source — do not re-derive hex elsewhere.
  clinical-blue: "oklch(0.48 0.16 255)"
  clinical-blue-foreground: "oklch(0.99 0 0)"
  vital-green: "oklch(0.72 0.17 152)"
  vital-green-foreground: "oklch(0.22 0.03 152)"
  amber-alert: "oklch(0.80 0.15 75)"
  amber-alert-foreground: "oklch(0.26 0.05 75)"
  critical-red: "oklch(0.60 0.21 25)"
  critical-red-foreground: "oklch(0.99 0 0)"
  cyan-signal: "oklch(0.58 0.12 210)"
  cyan-signal-foreground: "oklch(0.99 0 0)"
  porcelain-azure-bg: "oklch(0.985 0.004 255)"
  pure-white-surface: "oklch(1 0 0)"
  ink-navy-foreground: "oklch(0.22 0.02 255)"
  dust-slate-muted: "oklch(0.52 0.015 255)"
  hairline-azure-border: "oklch(0.90 0.01 255)"
  umbra-bg-dark: "oklch(0.16 0.006 255)"
  carbon-panel-surface-dark: "oklch(0.21 0.008 255)"
  chalk-foreground-dark: "oklch(0.96 0.006 255)"
  smoke-slate-muted-dark: "oklch(0.68 0.02 255)"
  hairline-dusk-border-dark: "oklch(0.30 0.012 255)"
typography:
  display:
    fontFamily: "Geist Variable, Inter Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(1.75rem, 1.4rem + 1.5vw, 2.5rem)"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Geist Variable, Inter Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.375rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Geist Variable, Inter Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "normal"
  body:
    fontFamily: "Geist Variable, Inter Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
  label:
    fontFamily: "Geist Variable, Inter Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.01em"
  mono:
    fontFamily: "Geist Mono Variable, ui-monospace, SFMono-Regular, monospace"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
rounded:
  badges: "9999px"
  buttons: "9999px"
  inputs: "10px"
  nav: "10px"
  cards: "16px"
  images: "12px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  section: "40px"
components:
  button-primary:
    backgroundColor: "{colors.clinical-blue}"
    textColor: "{colors.clinical-blue-foreground}"
    rounded: "{rounded.buttons}"
    padding: "10px 20px"
  button-primary-hover:
    backgroundColor: "{colors.clinical-blue}"
  button-secondary:
    backgroundColor: "{colors.pure-white-surface}"
    textColor: "{colors.ink-navy-foreground}"
    rounded: "{rounded.buttons}"
    padding: "10px 20px"
  badge-success:
    backgroundColor: "{colors.vital-green}"
    textColor: "{colors.vital-green-foreground}"
    rounded: "{rounded.badges}"
    padding: "2px 10px"
  badge-warning:
    backgroundColor: "{colors.amber-alert}"
    textColor: "{colors.amber-alert-foreground}"
    rounded: "{rounded.badges}"
    padding: "2px 10px"
  badge-danger:
    backgroundColor: "{colors.critical-red}"
    textColor: "{colors.critical-red-foreground}"
    rounded: "{rounded.badges}"
    padding: "2px 10px"
  badge-info:
    backgroundColor: "{colors.cyan-signal}"
    textColor: "{colors.cyan-signal-foreground}"
    rounded: "{rounded.badges}"
    padding: "2px 10px"
  card:
    backgroundColor: "{colors.pure-white-surface}"
    rounded: "{rounded.cards}"
    padding: "24px"
---

# Design System: MedImaging

## 1. Overview

**Creative North Star: "The Triage Board"**

MedImaging is the workspace a radiologist opens between patients: fast, unambiguous, and never cold. The system rejects two extremes at once — the previous "deep-space nebula" direction (a purple cosmic dev-tool aesthetic borrowed from a marketing landing page, with terminal boxes and logo clouds that had nothing to do with clinical work) and the generic gray corporate admin dashboard (flat, colorless, personality-free). Instead, color is treated the way a triage board treats color: every hue on screen means something — a risk level, a study status, a category — never applied for decoration.

The palette is genuinely rich (clinical blue for brand and primary action, cyan for informational state, vital green / amber / critical red for risk and status), but it stays calm because each color is scoped to a specific, learnable meaning, the way Stripe's dashboard uses a rich palette without ever feeling loud. Surfaces stay quiet — pure white cards floating on a whisper-tinted page — so the color budget is spent entirely on things the clinician needs to act on.

**Key Characteristics:**
- A single confident brand color (Clinical Blue) carries identity in nav, primary actions, and links — never sprayed across backgrounds.
- Four dedicated semantic hues (green / amber / red / indigo) exist ONLY to encode risk and status — they are never reused for decoration.
- Quiet white/near-black surfaces with soft, minimal elevation — the color budget goes to meaning, not to the canvas.
- Both light and dark themes are first-class from day one, wired through `next-themes` + the `.dark` / `[data-theme="dark"]` selector.

## 2. Colors

Five roles: one brand color, one informational accent, three risk/status colors, and a quiet neutral scale that carries almost no chroma of its own.

### Primary
- **Clinical Blue** (`oklch(0.48 0.16 255)`): The brand color. Used for primary buttons, active nav state, links, focus rings, and the loading/progress indicators. Never used as a page or card background — it appears as filled controls and text, not as atmosphere.

### Secondary
- **Cyan Signal** (`oklch(0.58 0.12 210)`): The informational accent — distinct in both hue and lightness from Clinical Blue. Used for "in progress / informational" states (e.g. a study `EN_ANALISIS`), secondary chips, and any UI that needs a second brand-adjacent color without being mistaken for the primary action.

### Tertiary — Risk & Status
- **Vital Green** (`oklch(0.72 0.17 152)`): Positive / low-risk / completed states only (`BAJO`, `COMPLETADO`).
- **Amber Alert** (`oklch(0.80 0.15 75)`): Caution / moderate-risk / pending-review states only (`MODERADO`).
- **Critical Red** (`oklch(0.60 0.21 25)`): Critical risk / destructive actions only (`CRITICO`, delete confirmations).

### Neutral
- **Porcelain Azure** (`oklch(0.985 0.004 255)`) — page background (light). A near-white with a whisper of the brand hue, never a competing warm/cream cast.
- **Pure White** (`oklch(1 0 0)`) — surface/card background (light). Sits one step brighter than the page so cards read as elevated without a shadow doing all the work.
- **Ink Navy** (`oklch(0.22 0.02 255)`) — primary text (light).
- **Dust Slate** (`oklch(0.52 0.015 255)`) — secondary/muted text (light).
- **Hairline Azure** (`oklch(0.90 0.01 255)`) — borders and dividers (light).
- **Umbra** (`oklch(0.16 0.006 255)`) — page background (dark).
- **Carbon Panel** (`oklch(0.21 0.008 255)`) — surface/card background (dark).
- **Chalk** (`oklch(0.96 0.006 255)`) — primary text (dark).
- **Smoke Slate** (`oklch(0.68 0.02 255)`) — secondary/muted text (dark).
- **Hairline Dusk** (`oklch(0.30 0.012 255)`) — borders and dividers (dark).

### Named Rules
**The Meaning-Only Rule.** Vital Green, Amber Alert, Critical Red, and Cyan Signal are reserved exclusively for risk level and study status. If a new UI element needs a color and it isn't communicating risk or status, reach for Clinical Blue, or don't add color at all.

**The Soft-Fill Rule.** Status and risk badges never use a fully solid color fill. Use HeroUI's `-soft` tokens (`bg-success-soft text-success-soft-foreground`, etc.) — a tinted background with full-strength text — so five different states can sit in one table row without turning it into a traffic light.

## 3. Typography

**Display/Body Font:** Geist Variable (with Inter Variable, ui-sans-serif fallback)
**Mono Font:** Geist Mono Variable (with ui-monospace fallback) — study IDs, timestamps, technical values only.

**Character:** A single geometric-humanist sans carries the whole system at multiple weights — no display face, because a clinical tool earns trust through restraint and speed, not typographic drama. Geist Mono marks anything that is a technical value (an ID, a filename, a raw measurement) so it reads as data rather than prose.

### Hierarchy
- **Display** (600, `clamp(1.75rem, 1.4rem + 1.5vw, 2.5rem)`, 1.15): Page-level titles only (e.g. "Dashboard", a patient's name on their detail page).
- **Headline** (600, 22px, 1.25): Section headers within a page (card group titles, modal titles).
- **Title** (600, 14px, 1.4): Card and table-group titles, nav section labels.
- **Body** (400, 14px, 1.6, max 75ch): Default UI and body copy.
- **Label** (500, 12px, 1.4, 0.01em): Form labels, table headers, small metadata.

### Named Rules
**The One Face Rule.** Every weight from 400–700 comes from Geist Variable. Introducing a second display face would fight the "calm and reliable" personality; weight and size carry all the hierarchy this system needs.

## 4. Elevation

Flat by default, soft by exception. Cards and panels use a single low, tight shadow (never a hairline border stacked on top of it) so hierarchy reads as gentle lift rather than a hard-edged brutalist frame. In dark mode shadows disappear entirely — HeroUI's dark theme already sets `--surface-shadow` to transparent, and depth there comes from the surface being one step lighter than the page instead.

### Shadow Vocabulary
- **Card rest** (`--surface-shadow`, light: `0 1px 2px rgba(24,24,27,0.04), 0 1px 3px rgba(24,24,27,0.06)`): Default elevation for cards, stat tiles, and table containers.
- **Overlay** (`--overlay-shadow`): Modals, popovers, dropdowns — a slightly larger, softer shadow than cards, reserved for anything that floats above the page.

### Named Rules
**The One Shadow Rule.** A surface gets a border OR a shadow, never both. Cards in this system use shadow only; the sidebar and table dividers use a hairline border only because they're structural, not elevated.

## 5. Components

### Buttons
- **Shape:** Full pill (`border-radius: 9999px`).
- **Primary:** Clinical Blue fill, white text, `10px 20px` padding. Used for the one primary action per screen ("Nuevo estudio", "Acceder", "Crear administrador").
- **Secondary / Ghost:** White/surface fill with a hairline border (light) or transparent with hover-surface (dark); text in `foreground`. Used for the secondary action next to a primary button ("Nuevo paciente").
- **Hover / Focus:** Background shifts via HeroUI's built-in `-hover` color-mix tokens; focus ring uses `--focus` (= Clinical Blue) at 2px offset.

### Badges (Status & Risk)
- **Style:** Pill shape, soft-fill only (see The Soft-Fill Rule) — `bg-success-soft text-success-soft-foreground`, `bg-warning-soft …`, `bg-danger-soft …`, `bg-info-soft …` (info added as a custom HeroUI color).
- **State:** No hover/active state — badges are read-only status, not controls.

### Cards / Containers
- **Corner Style:** 16px radius.
- **Background:** Pure White (light) / Carbon Panel (dark).
- **Shadow Strategy:** See Elevation — soft shadow only, no border.
- **Internal Padding:** 24px.

### Inputs / Fields
- **Style:** Field background matches surface; 1px `field-border` (Hairline Azure/Dusk) at 10px radius — visible outline by default, since ambiguous form boundaries are a real risk in a clinical data-entry context.
- **Focus:** Border shifts to Clinical Blue via `--field-border-focus`.
- **Error:** Border and helper text shift to Critical Red.

### Navigation
- **Style:** Left sidebar (240px), Porcelain Azure/Umbra background, hairline right border. Active item: Clinical Blue soft-fill background + blue text + blue icon. Inactive: muted text, hover to a neutral surface-hover tint (never colored — color is reserved for the active state so it stays legible as "you are here").

## 6. Do's and Don'ts

### Do:
- **Do** reserve Vital Green / Amber Alert / Critical Red / Cyan Signal strictly for risk level and study status — never for decoration, marketing accents, or arbitrary UI variety.
- **Do** use soft-fill badges (`*-soft` / `*-soft-foreground`) for every status and risk indicator so multiple states can coexist in a table without visual noise.
- **Do** keep both light and dark themes fully specified — every new color role needs a light AND dark value before it ships.
- **Do** use Clinical Blue for the single primary action on a screen; if two buttons compete for the brand blue, one of them should be a secondary/ghost button instead.
- **Do** give risk/status badges a text label alongside color — color alone must never be the only signal (colorblind safety on `BAJO`/`MODERADO`/`CRITICO`).

### Don't:
- **Don't** bring back the deep-space nebula aesthetic — no purple nebula gradients, no terminal-window chrome, no logo-cloud trust strips, no dev-tool-landing-page framing. This product is a clinical workspace, not a marketing site.
- **Don't** default to gray. A `NO_EVALUADO` or `PENDIENTE` state can be neutral, but never let the whole screen go achromatic — that's the generic-corporate-dashboard failure mode this system explicitly rejects.
- **Don't** pair a 1px border with a soft wide drop shadow on the same card — pick one (see The One Shadow Rule).
- **Don't** use Critical Red for anything that isn't an actual critical-risk state or a destructive action — reserving it is what makes it trustworthy when it does appear.
- **Don't** introduce a second display typeface or drop below 14px / above 22px for in-app body and title text — the type scale stays tight and instrument-legible.
