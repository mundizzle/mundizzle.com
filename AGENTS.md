# mundizzle.com

Single-page personal site. Source files live under `src/`, generated deploy output lives under `dist/`, and Netlify publishes `dist/`. `CLAUDE.md` is a symlink to this file.

## Repo layout

- `src/resume.md` is the canonical editable resume source.
- `src/resume.css` styles the generated PDF.
- `src/template.html` contains the site chrome and HTML hooks.
- `scripts/build.mjs` generates the deploy output.
- `dist/` is fully generated and should not be edited by hand.
- `netlify.toml` at the repo root is the source of truth for publish/build/redirect behavior.

## Commands

Build the deployable site:

```sh
npm run build
```

Preview locally with Netlify routing:

```sh
npm run dev
```

## Build behavior

The build script:
1. Reads content from `src/`.
2. Regenerates `dist/index.html`, `dist/resume.md`, and `dist/resume.pdf`.
3. Removes stale legacy duplicate download artifacts if present.

## Mapping: `src/resume.md` → `dist/index.html`

The generator in `scripts/build.mjs` applies these rules. Keep the class structure in `src/template.html` aligned with it — the CSS depends on these hooks.

| Markdown | HTML |
| --- | --- |
| `# Name` | `.masthead .nameblock h1` (`{{NAME}}`) |
| First contact `<br>` line without a link | `.masthead .sys-label .location` (`{{LOCATION}}`) |
| Remaining linked contact lines | `.masthead .meta` as one `<a>` per line (`{{META}}`) |
| `## Section` between `---` | `<section id="...">` with a `.sec-head` |
| `### Title, Company` | `<article class="job">` with `<h3>Title <span class="at">//</span> <span class="co">Company</span></h3>` |
| `*Dates*` / `*Dates · tenure*` | `.job-meta > .dates` and optional `.tenure` |
| Paragraph after the italic date line | `<p class="context">` |
| Top-level `- ` list | `<ul class="bullets">` |
| Nested `- **Signature engagements:**` / `- **Selected work:**` sub-list | `<div class="sub-head">Signature Engagements</div>` + `<ul class="sig">` |
| `- **Flagship clients led**: …` / `- **Selected clients**: …` | `<p class="flagship"><span class="tag">Flagship Clients</span> …</p>` |
| Skills paragraphs | `<dl class="skills-body">` using canonical buckets |
| `**School**, degree` + `*Dates*` | `.edu-body` with `<strong>` + `<span class="dates">` |

## Deploy expectations

- Netlify publishes `dist/`, not the repo root.
- Friendly public URLs `/mundi-morgado-resume.md` and `/mundi-morgado-resume.pdf` are rewrites to `dist/resume.md` and `dist/resume.pdf`.
- `dist/` is generated output and should stay out of version control.

## Style rules

- No `<script>`. No Google Fonts, no external stylesheets.
- Font: `ui-monospace, monospace` — system default.
- Dark mode via `@media (prefers-color-scheme: dark)` only. No toggle.
- Body font-size: unset (browser default, 16px).
