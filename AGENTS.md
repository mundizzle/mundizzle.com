# mundizzle.com

Single-page personal site built with Vite, React, TypeScript, and Tailwind. `CLAUDE.md` is a symlink to this file.

## Repo layout

- `src/resume.md` is the canonical editable resume source.
- `src/endorsements.md` is the canonical endorsements source.
- `src/components/` contains the site sections and shared UI.
- `src/app.css` is the Tailwind entrypoint for the web app.
- `src/generated/resume-data.ts` is generated app data and should not be edited by hand.
- `src/resume-pdf.css` styles the generated PDF.
- `scripts/build-content.mjs` parses source content and writes generated artifacts.
- `dist/` is fully generated and should not be edited by hand.
- `netlify.toml` at the repo root is the source of truth for publish/build/redirect behavior.

## Commands

Start the Vite+ dev server:

```sh
vp dev
```

Run formatting, linting, and type checks:

```sh
vp check
```

Build the website bundle only:

```sh
vp build
```

Build the full deployable site and resume artifacts:

```sh
vp run build
```

Preview the built app locally:

```sh
vp preview
```

## Build behavior

- Vite owns the website build and writes the app into `dist/`.
- The content build script parses `src/resume.md` and `src/endorsements.md`.
- The content build regenerates `src/generated/resume-data.ts` for the React app.
- `vp build` runs the built-in Vite+ production build for the site bundle only.
- `vp run build` runs the project-level build script, which:
  - regenerates app data
  - runs `vp build`
  - writes `dist/resume.md` and `dist/resume.pdf`

## Deploy expectations

- Netlify publishes `dist/`, not the repo root.
- Friendly public URLs `/mundi-morgado-resume.md` and `/mundi-morgado-resume.pdf` are rewrites to `dist/resume.md` and `dist/resume.pdf`.
- `dist/` and `src/generated/` are generated output and should stay out of version control.

## Style rules

- No Google Fonts.
- Font: `ui-monospace, monospace` — system default.
- Dark mode via `@media (prefers-color-scheme: dark)` only. No toggle.
- Prefer utility-first Tailwind classes in JSX over custom semantic CSS selectors.

<!--VITE PLUS START-->

# Using Vite+, the Unified Toolchain for the Web

This project is using Vite+, a unified toolchain built on top of Vite, Rolldown, Vitest, tsdown, Oxlint, Oxfmt, and Vite Task. Vite+ wraps runtime management, package management, and frontend tooling in a single global CLI called `vp`. Vite+ is distinct from Vite, but it invokes Vite through `vp dev` and `vp build`.

## Vite+ Workflow

`vp` is a global binary that handles the full development lifecycle. Run `vp help` to print a list of commands and `vp <command> --help` for information about a specific command.

### Start

- create - Create a new project from a template
- migrate - Migrate an existing project to Vite+
- config - Configure hooks and agent integration
- staged - Run linters on staged files
- install (`i`) - Install dependencies
- env - Manage Node.js versions

### Develop

- dev - Run the development server
- check - Run format, lint, and TypeScript type checks
- lint - Lint code
- fmt - Format code
- test - Run tests

### Execute

- run - Run monorepo tasks
- exec - Execute a command from local `node_modules/.bin`
- dlx - Execute a package binary without installing it as a dependency
- cache - Manage the task cache

### Build

- build - Build for production
- pack - Build libraries
- preview - Preview production build

### Manage Dependencies

Vite+ automatically detects and wraps the underlying package manager such as pnpm, npm, or Yarn through the `packageManager` field in `package.json` or package manager-specific lockfiles.

- add - Add packages to dependencies
- remove (`rm`, `un`, `uninstall`) - Remove packages from dependencies
- update (`up`) - Update packages to latest versions
- dedupe - Deduplicate dependencies
- outdated - Check for outdated packages
- list (`ls`) - List installed packages
- why (`explain`) - Show why a package is installed
- info (`view`, `show`) - View package information from the registry
- link (`ln`) / unlink - Manage local package links
- pm - Forward a command to the package manager

### Maintain

- upgrade - Update `vp` itself to the latest version

These commands map to their corresponding tools. For example, `vp dev --port 3000` runs Vite's dev server and works the same as Vite. `vp test` runs JavaScript tests through the bundled Vitest. The version of all tools can be checked using `vp --version`. This is useful when researching documentation, features, and bugs.

## Common Pitfalls

- **Using the package manager directly:** Do not use pnpm, npm, or Yarn directly. Vite+ can handle all package manager operations.
- **Always use Vite commands to run tools:** Don't attempt to run `vp vitest` or `vp oxlint`. They do not exist. Use `vp test` and `vp lint` instead.
- **Running scripts:** Vite+ built-in commands (`vp dev`, `vp build`, `vp test`, etc.) always run the Vite+ built-in tool, not any `package.json` script of the same name. To run a custom script that shares a name with a built-in command, use `vp run <script>`. For example, if you have a custom `dev` script that runs multiple services concurrently, run it with `vp run dev`, not `vp dev` (which always starts Vite's dev server).
- **This repo has both:** `vp build` builds only the site bundle. Use `vp run build` when you want the full deploy build with `resume.md` and `resume.pdf`.
- **Do not install Vitest, Oxlint, Oxfmt, or tsdown directly:** Vite+ wraps these tools. They must not be installed directly. You cannot upgrade these tools by installing their latest versions. Always use Vite+ commands.
- **Use Vite+ wrappers for one-off binaries:** Use `vp dlx` instead of package-manager-specific `dlx`/`npx` commands.
- **Import JavaScript modules from `vite-plus`:** Instead of importing from `vite` or `vitest`, all modules should be imported from the project's `vite-plus` dependency. For example, `import { defineConfig } from 'vite-plus';` or `import { expect, test, vi } from 'vite-plus/test';`. You must not install `vitest` to import test utilities.
- **Type-Aware Linting:** There is no need to install `oxlint-tsgolint`, `vp lint --type-aware` works out of the box.

## CI Integration

For GitHub Actions, consider using [`voidzero-dev/setup-vp`](https://github.com/voidzero-dev/setup-vp) to replace separate `actions/setup-node`, package-manager setup, cache, and install steps with a single action.

```yaml
- uses: voidzero-dev/setup-vp@v1
  with:
    cache: true
- run: vp check
- run: vp test
```

## Review Checklist for Agents

- [ ] Run `vp install` after pulling remote changes and before getting started.
- [ ] Run `vp check` and `vp test` to validate changes.
<!--VITE PLUS END-->
