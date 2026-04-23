---
version: alpha
name: Mundi Resume Dossier
description: Editorial technical resume site with a document-first rail layout, restrained cyan accent, and dual web/PDF presentation modes.
colors:
  primary: "#0e1216"
  secondary: "#484e52"
  tertiary: "#00739d"
  neutral: "#fbfaf7"
  surface: "#f6f5f2"
  rule: "#c9ced2"
  rule-strong: "#292f32"
  grid: "#e9ebee"
  faint: "#6b6f73"
typography:
  display:
    fontFamily: ui-monospace, monospace
    fontSize: 34px
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: -0.015em
    fontFeature: '"tnum" 1, "zero" 1'
  section-title:
    fontFamily: ui-monospace, monospace
    fontSize: 15px
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: 0.24em
    fontFeature: '"tnum" 1, "zero" 1'
  rail-label:
    fontFamily: ui-monospace, monospace
    fontSize: 11px
    fontWeight: 400
    lineHeight: 1.35
    letterSpacing: 0.2em
    fontFeature: '"tnum" 1, "zero" 1'
  body:
    fontFamily: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif
    fontSize: 15px
    fontWeight: 400
    lineHeight: 1.7
  body-tight:
    fontFamily: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif
    fontSize: 15px
    fontWeight: 400
    lineHeight: 1.6
  meta:
    fontFamily: ui-monospace, monospace
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.3
    letterSpacing: 0.12em
    fontFeature: '"tnum" 1, "zero" 1'
rounded:
  none: 0px
  sm: 2px
  pill: 999px
spacing:
  xs: 6px
  sm: 10px
  md: 18px
  lg: 28px
  xl: 64px
  rail-width: 120px
  content-max: 860px
components:
  page-shell:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.primary}"
    typography: "{typography.rail-label}"
    padding: 20px
  section-header:
    textColor: "{colors.primary}"
    typography: "{typography.section-title}"
  rail-label:
    textColor: "{colors.faint}"
    typography: "{typography.rail-label}"
  page-grid:
    backgroundColor: "{colors.grid}"
  section-divider:
    backgroundColor: "{colors.rule}"
  frame-divider:
    backgroundColor: "{colors.rule-strong}"
  format-button:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.tertiary}"
    typography: "{typography.meta}"
    rounded: "{rounded.none}"
    height: 28px
    width: 42px
  format-button-hover:
    backgroundColor: "{colors.tertiary}"
    textColor: "{colors.neutral}"
  selected-work-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.secondary}"
    typography: "{typography.body-tight}"
    rounded: "{rounded.none}"
    padding: 14px
  endorsement-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.secondary}"
    typography: "{typography.body}"
    rounded: "{rounded.none}"
    padding: 14px
---

# DESIGN.md

## Overview

This system should feel like a polished engineering dossier rendered on the web. The personality is editorial, technical, and quietly confident. It should read as a living resume document shaped by front-end craft, not as a glossy marketing portfolio or generic personal brand site.

The defining metaphor is a structured technical artifact: left rail metadata, indexed sections, thin rules, muted surfaces, and a restrained cyan accent. The visual voice is calm and exacting. It favors precision, hierarchy, and legibility over novelty.

This repo intentionally has two presentation surfaces. The web experience carries the atmosphere: monospace framing, grid wash, dark-mode support, and document-like rhythm. The generated PDF is flatter and more conventional, but it should still feel like the same information architecture translated for print.

## Colors

The palette is built from warm paper neutrals, blue-black ink, and a single technical cyan used with restraint.

- **Primary (`#0e1216`):** Deep blue-black ink for core text, headings, and the overall sense of seriousness.
- **Secondary (`#484e52`):** Muted graphite for body support text, descriptive copy, and lower-priority detail.
- **Tertiary (`#00739d`):** Restrained technical cyan reserved for emphasis, action states, section punctuation, and selective metadata.
- **Neutral (`#fbfaf7`):** Warm paper off-white that keeps the site from feeling sterile or product-demo bright.
- **Surface (`#f6f5f2`):** Slightly raised panel tone for selected-work and endorsement blocks.
- **Rule (`#c9ced2`):** Soft structural divider for section framing.
- **Rule Strong (`#292f32`):** Dark anchor line for moments that need firmer document framing.
- **Grid (`#e9ebee`):** Faint blueprint-style background lattice, always subtle and never a dominant texture.
- **Faint (`#6b6f73`):** Low-emphasis metadata and supporting labels.

Dark mode should mirror these same semantic roles with cooler, lower-luminance neutrals and a brighter cyan. The visual grammar should remain the same in both modes: neutral-led, accent-sparse, and document-first.

Do not expand the palette with additional bright brand colors. Most of the interface should remain neutral, with cyan acting like a precision marker rather than a marketing color.

## Typography

The typography system is split between a monospace shell and a system-sans reading layer.

- **Display:** `ui-monospace, monospace` for the name and the strongest moments of structural identity. It should feel crisp, compact, and engineered.
- **Section Titles:** Monospace, uppercase, tracked wide. These act as indexed document markers rather than expressive headlines.
- **Rail Labels and Metadata:** Monospace with tabular-number behavior where helpful. Dates, labels, section indices, and small system cues belong here.
- **Body:** System sans for paragraphs, bullets, endorsements, and other reading-heavy blocks. This keeps the site readable without losing the technical frame.

Typography should create hierarchy through weight, size, spacing, and casing before introducing more color. The name is the only genuinely large headline. Most other emphasis should come from structure and rhythm.

## Layout

The layout is a centered single-page document constrained to a readable width, with a left rail used for indexing and metadata.

- Content max width is `860px`.
- The desktop signature is a two-column rail layout with `120px` rail width and `28px` gap.
- The rail is used for dates, labels, section indices, and compact metadata.
- The main column carries narrative copy and primary content.
- Summary copy can break out of the visible rail structure but should still align to its offset logic.

Spacing should feel deliberate and editorial. Use section spacing to create rhythm, then tighter intra-block spacing to preserve compactness. The background grid follows a `64px` rhythm and should remain faint enough to read as atmosphere rather than ornament.

On mobile, the rail collapses into stacked rows. Preserve order and legibility; do not force decorative desktop alignment patterns into cramped viewports.

## Elevation & Depth

Depth is intentionally minimal. This design system is primarily flat and structural.

- Use borders, separators, and layout rhythm before shadows.
- Surfaces may step slightly off the main background through tone changes, not through dramatic elevation.
- Highlighted blocks such as selected work and endorsements can use the `surface` color plus a left accent rule to feel annotated rather than cardified.

Avoid soft product-dashboard shadows, floating panels, glass effects, or any treatment that suggests glossy SaaS UI.

## Shapes

The system is mostly squared-off and architectural.

- Default shape language is sharp or nearly sharp.
- Most containers and dividers should read as lines, edges, and blocks rather than rounded objects.
- Pill geometry is reserved for very small utility moments only when already present in the implementation, such as a fully rounded accent dot.
- Buttons should feel like compact document controls, not soft app buttons.

The overall shape language should reinforce seriousness and precision.

## Components

### Page Shell

The page shell is a centered document frame with generous top and bottom padding. A subtle fixed background grid sits behind the content. The footer closes the page with an understated structural rule and `END OF FILE` language.

### Header

The header is framed by top and bottom borders. It begins with a small status-like cue: accent dot plus `CV`. The name is large and direct. Contact information should read like clean document metadata, not as a row of branded social buttons.

The `MD` and `PDF` controls are compact format toggles. They are bordered, rectangular, and uppercase. Their hover behavior may invert foreground/background using the accent, but the interaction should stay crisp and immediate.

### Section Headers

Section headers use bracketed numeric indices like `[00]`. They function as navigational and rhythmic anchors, not as expressive hero headlines. Their uppercase, tracked styling is essential to the dossier feel.

### Skills

Skills are rendered as categorized plain-text token lists. Each item is introduced with an accent dash marker. Do not convert them into badges, pills, or icon chips.

### Experience

Experience is the dominant section and should feel like the center of gravity of the page. Each role is a document block with dates in the rail and narrative detail in the main column.

Company names may carry accent emphasis. Bullets use accent dash markers rather than browser-default bullets. "Selected Work" may use a left accent rule with a surface background. "Selected Clients" should return to a flatter divider-row treatment.

### Education

Education is compact and restrained. Dates remain in the rail. School and degree stay in the main column with minimal ornament.

### Endorsements

Endorsements should read like annotated references, not like a carousel or quote wall. Each entry can use a surface fill plus a left accent rule. Attribution remains compact, with selective accent emphasis for company names.

## Do's and Don'ts

### Do

- Keep the design editorial, technical, and document-first.
- Use the rail layout as the main organizing device on larger screens.
- Let borders, spacing, and typography carry hierarchy.
- Use cyan sparingly for precision emphasis.
- Preserve the sense that this is a curated resume artifact shaped by front-end taste.

### Don't

- Do not introduce glossy SaaS gradients, glassmorphism, or dashboard-style shadows.
- Do not turn the page into a centered marketing hero with oversized CTAs.
- Do not add extra bright accent colors.
- Do not replace the monospace shell with expressive brand typography.
- Do not convert skill lists into badges or endorsement blocks into oversized testimonial cards.
- Do not use playful illustration, emoji, mascot, or startup-brand visual language.
- Do not make motion a focal point. No parallax, animated gradients, or decorative transitions.
