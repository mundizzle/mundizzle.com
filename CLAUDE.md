# mundizzle.com

Single-page personal site. `index.html` is the only file — inlined CSS, no JS, no external assets.

## Regenerating `index.html` from `resume.md`

Canonical resume content lives in the sibling repo at `../resume/resume.md`. When it changes, regenerate `index.html` by asking Claude Code: "regenerate index.html from resume.md".

**What to do:**
1. Read `../resume/resume.md` fresh.
2. Preserve everything in `index.html` that isn't content (the `<head>`/`<style>` block, masthead chrome, section index numbers, Skills grouping, footer).
3. Rewrite the content regions using the mapping below. Keep the HTML/CSS class structure identical — the design depends on it.

## Mapping: `resume.md` → `index.html`

| Markdown | HTML |
| --- | --- |
| `# Name` | `.masthead .nameblock h1` |
| Contact `<br>` list | `.masthead .meta` — `<span>` for plain, `<a>` for links. `→ ` prefix on anchors is a CSS `::before`; don't add it in markup |
| `## Section` between `---` | `<section id="...">` with a `.sec-head` containing `[NN] INDEX`, the section title, and `.sec-rule` |
| `### Title, Company` | `<article class="job">` with `<h3>Title <span class="at">//</span> <span class="co">Company</span></h3>` |
| `*Dates*` italic line | `.job-meta > .dates` |
| `*Dates · tenure*` | split on `·` → `.dates` + `.tenure` |
| Paragraph right after the italic | `<p class="context">` |
| Top-level `- ` list | `<ul class="bullets">` |
| Nested `- **Signature engagements:**` sub-list | `<div class="sub-head">Signature Engagements</div>` + `<ul class="sig">` |
| Nested `- **Flagship clients led**: ...` | `<p class="flagship"><span class="tag">Flagship Clients</span> ...</p>` — join names with ` · ` |
| `**Languages:** ...`, `**Platforms...:** ...`, `**General:** ...` paragraphs | `<dl class="skills-body">` with one `.skill-row` per category; split values on `,` into `<span class="tok">` |
| `**School**, degree` + `*Dates*` | `.edu-body` with `<strong>` + `<span class="dates">` |

## Chrome that does not come from `resume.md`

These live only in `index.html`. Keep them as-is unless explicitly asked to change them.

- `CV / v.YYYY.MM` status label in masthead
- Section index numbers `[00] INDEX`, `[01] INDEX`, etc. — renumber if sections are added/removed
- Skills category names (Languages / Platforms & Tools / Practice) and token splitting
- Footer `mundizzle.com` / `END OF FILE`

## Style rules

- No `<script>`. No Google Fonts, no external stylesheets.
- Font: `ui-monospace, monospace` — system default.
- Dark mode via `@media (prefers-color-scheme: dark)` only. No toggle.
- Body font-size: unset (browser default, 16px).
