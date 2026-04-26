# Additional Conventions Beyond the Built-in Functions

As this project's AI coding tool, you must follow the additional conventions below, in addition to the built-in functions.

# Ripple Project Guide for AI Agents

Ripple is a TypeScript-first UI framework and monorepo maintained by Dominic
Gannaway. The current authoring format is centered on `.tsrx` files and the shared
TSRX compiler stack. Older `.ripple`-specific docs and compiler details still
exist in repo history and changelogs, but they are not the right default source of
truth for current work.

## Start From Current Sources

Use the nearest live source rather than historical summaries:

- `website/public/llms.txt` for current Ripple syntax, runtime APIs, and authoring
  guidance
- `README.md` for project overview, positioning, and quick-start examples
- `packages/*/README.md` for package-specific usage and public APIs
- `vitest.config.js` for the current test projects and file globs
- `package.json` for workspace-wide scripts such as `rules:generate`, `test`,
  `format`, `format:check`, and `typecheck`

If a guide in this repo conflicts with nearby code or package READMEs, trust the
nearby code and current package docs.

## RuleSync

This repository uses RuleSync as the single source of truth for shared AI agent
instructions. Edit `.rulesync/rules/` and regenerate derived files instead of
patching generated outputs directly.

Generated targets include:

- `AGENTS.md`
- `.github/copilot-instructions.md`
- `CLAUDE.md`
- `GEMINI.md`
- `.cursor/rules/project.mdc`

After changing RuleSync content, run:

```bash
pnpm rules:generate
```

## Monorepo Map

This is a pnpm monorepo. The current high-level layout is:

- `packages/tsrx/`: core parser, transforms, and shared compiler infrastructure
- `packages/tsrx-ripple/`, `packages/tsrx-react/`, `packages/tsrx-solid/`,
  `packages/tsrx-preact/`: target-specific compiler layers
- `packages/ripple/`: Ripple runtime, server helpers, and framework behavior
- `packages/vite-plugin/`, `packages/rollup-plugin/`,
  `packages/vite-plugin-react/`, `packages/vite-plugin-solid/`,
  `packages/vite-plugin-preact/`, `packages/rspack-plugin-react/`,
  `packages/turbopack-plugin-react/`: bundler integrations
- `packages/adapter/`, `packages/adapter-node/`, `packages/adapter-bun/`,
  `packages/adapter-vercel/`: deployment and platform adapters
- `packages/language-server/`, `packages/typescript-plugin/`,
  `packages/vscode-plugin/`, `packages/intellij-plugin/`, `packages/nvim-plugin/`,
  `packages/sublime-text-plugin/`, `packages/zed-plugin/`: editor and language
  tooling
- `packages/eslint-parser/`, `packages/eslint-plugin/`,
  `packages/prettier-plugin/`, `packages/prettier-plugin-ripple/`: linting and
  formatting
- `packages/create-ripple/`, `templates/`, `playground/`: scaffolding and local
  examples
- `website/`, `website-new/`, `website-tsrx/`: documentation and website work

When routing a change, prefer the package that directly owns the behavior rather
than editing generated output, tests, or editor integrations first.

## Current Working Assumptions

- Default component files are `.tsrx`. Do not describe the project as primarily
  using `.ripple` files unless the local file you are editing actually does.
- Some packages still preserve compatibility or historical references. Treat them
  as compatibility context, not the default architecture description.
- Use `pnpm` for all package management and workspace scripts.
- Follow the conventions of the package you are changing. This repo mixes plain
  JavaScript, JSDoc-typed JavaScript, and TypeScript depending on package.
- Match nearby naming, file layout, and test style instead of applying a single
  convention repo-wide.

## Finding The Right Package

Use these rough routing rules:

- Ripple syntax, parsing, source transforms, or shared AST behavior:
  `packages/tsrx/` and the relevant target package under `packages/tsrx-*`
- Ripple runtime behavior, hydration, reactivity, DOM updates, or server output:
  `packages/ripple/`
- Vite, Rollup, Rspack, Turbopack, or adapter behavior: the relevant plugin or
  adapter package in `packages/`
- Diagnostics, completions, hover, definitions, or editor integration:
  `packages/language-server/`, `packages/typescript-plugin/`, and editor plugin
  packages
- Formatting or lint behavior: `packages/prettier-plugin/`,
  `packages/prettier-plugin-ripple/`, `packages/eslint-parser/`, or
  `packages/eslint-plugin/`

## Validation

Prefer the smallest validation that covers the touched surface.

Common workspace commands:

```bash
pnpm rules:generate
pnpm format:check
pnpm test
pnpm test --project ripple-client
pnpm test --project ripple-server
pnpm typecheck
```

Current Vitest projects are defined in `vitest.config.js`. Ripple runtime suites
use `.test.tsrx` files for many client, server, and compat tests, while tooling
packages often use `.test.js` or `.test.ts`.

## Changesets

Add a changeset for user-facing package changes. Skip changesets for docs-only,
test-only, and internal tooling updates.

```bash
pnpm changeset
```

## Practical Guidance For Agents

- Prefer the current docs in `website/public/llms.txt` over stale architectural
  summaries.
- Avoid copying removed compiler APIs, old package layouts, or legacy `.ripple`
  examples into new guidance.
- If you need exact behavior, read the owning package and its tests instead of
  relying on a repo-wide summary.
- Keep documentation updates short and durable. High-level guidance ages better
  than detailed internal call lists.
