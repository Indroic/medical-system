# Product

## Register

product

## Users

Clinicians and lab staff using an internal medical imaging platform to manage CT-scan workflows: registering patients, uploading CT studies, triggering YOLO-based AI anomaly detection, reviewing bounding-box results over the scan, and generating/downloading PDF reports. Used in a clinical or lab setting where staff move quickly between multiple patients and studies in one session, and where misreading a risk level has real consequences.

## Product Purpose

An internal CT-scan analysis pipeline: patient management → study upload → AI-assisted detection (YOLO) → clinician review → PDF report. Success looks like a clinician being able to triage risk (bajo/moderado/crítico) and study status at a glance, with zero ambiguity, while the interface itself feels modern and reassuring rather than clinical-sterile or cold.

## Brand Personality

Calm & reliable, but visually alive — the client explicitly wants a rich, colorful interface, not a gray corporate dashboard. The resolution: color used with purpose (per risk level, per study status, per category — Stripe-dashboard style), not color as decoration. Personality lives in the supporting UI (accents, charts, empty states, illustration) while critical clinical data stays legible and unambiguous.

## Anti-references

- The previous "deep space / cosmic nebula" dark theme (purple nebula gradients, terminal command boxes, logo clouds, dev-tool landing-page components) — explicitly discarded, does not fit a clinical product.
- Generic gray corporate admin dashboards — flat, colorless, personality-free.

## Design Principles

- **Color with purpose** — every saturated color maps to a clinical meaning (risk level, study status, category), never decoration for its own sake.
- **Clarity over drama** — risk badges, results, and report status must read instantly; brand personality never competes with critical data legibility.
- **Vivid but composed** — a rich, multi-color palette is the goal, but hierarchy and calm must survive it; avoid "look how colorful" for its own sake.
- **HeroUI-native** — build within HeroUI v3 (React Aria) conventions and its theming system rather than working against it.
- **Light and dark, both first-class** — both themes ship together (next-themes is already a dependency), not a light theme with dark mode bolted on later.

## Accessibility & Inclusion

No formal mandate from the client. Apply WCAG AA contrast as standard practice (4.5:1 body text, 3:1 large text/UI) given that risk and status badges are safety-relevant; don't let color alone carry critical meaning — pair with text/iconography where reasonable.
