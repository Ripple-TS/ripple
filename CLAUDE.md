# Ripple Project Guide for AI Agents

Ripple is a TypeScript-first UI framework and monorepo maintained by Dominic
Gannaway. This repository owns the Ripple runtime, Ripple-specific compiler
target, adapters, scaffolding, and framework integrations. The shared `.tsrx`
language, compiler core, non-Ripple targets, language tooling, editor plugins, and
syntax grammars are maintained in
[`tsrx-org/tsrx`](https://github.com/tsrx-org/tsrx).

## Start From Current Sources

Use the nearest live source rather than historical summaries:

- `website/public/llms.txt` for Ripple runtime APIs, target behavior, and
  Ripple-specific authoring guidance
- [tsrx.dev](https://tsrx.dev) for target-neutral TSRX syntax, tooling, and the
  language specification
- `README.md` for the Ripple overview, positioning, and quick-start examples
- `packages/*/README.md` for package-specific usage and public APIs
- `vitest.config.js` for the current Ripple test projects and file globs
- `package.json` for workspace-wide scripts such as `rules:generate`, `test`,
  `format`, `format:check`, and `typecheck`

If a guide conflicts with nearby code or package READMEs, trust the nearby code
and current package docs.

## Repository Boundary

This repository contains only Ripple-owned source:

- `packages/ripple/`: runtime, DOM behavior, hydration, SSR, reactivity, types,
  and server helpers
- `packages/tsrx-ripple/`: the Ripple-specific `@tsrx/ripple` compiler target
- `packages/vite-plugin/` and `packages/rollup-plugin/`: Ripple bundler
  integrations
- `packages/adapter/`, `packages/adapter-node/`, `packages/adapter-bun/`, and
  `packages/adapter-vercel/`: deployment and platform adapters
- `packages/cli/`, `packages/create-ripple/`, and `templates/`: Ripple scaffolding
- `playground/ripple/`, `benchmarks/`, `website/`, and `website-new/`: Ripple
  examples, performance work, and documentation

Shared `@tsrx/*` packages are registry dependencies. Do not recreate moved
compiler, formatter, linter, language-server, grammar, editor-plugin, or
non-Ripple target source here. Route changes in those areas to `tsrx-org/tsrx`;
update Ripple only when its target integration must adapt.

The intended dependency direction is Ripple -> published TSRX packages. Do not add
a workspace link, Git dependency, or copied source that reverses that boundary.
`@tsrx/ripple` is the deliberate exception in package naming: its source and
publishing authority remain in this repository because it implements Ripple
runtime semantics.

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

## Current Working Assumptions

- Default component files are `.tsrx`. Do not describe the project as primarily
  using `.ripple` files unless the local historical context requires it.
- Prefer the current TSRX component shape: `function Component(props) @{ ... }`
  when setup and output share a scope, or
  `function Component(props) { return <div />; }` for simple single-root output.
- TSRX templates use JSX-shaped elements, fragments, text, expression containers,
  and directive control flow. Do not introduce removed experimental
  template-boundary or legacy component syntaxes in new examples.
- When a template scope mixes TypeScript setup with rendered output, setup
  statements come first and the scope finishes with one output node: a JSX
  element, JSX fragment, or JSX control-flow expression. Wrap text, expression
  containers, or multiple siblings in a fragment when they are the output after
  setup.
- Use `@if`, `@for`, `@switch`, and `@try` for template control flow. Plain
  JavaScript control flow remains ordinary setup code.
- Use `pnpm` for all package management and workspace scripts.
- Follow the conventions of the package you are changing. This repo mixes plain
  JavaScript, JSDoc-typed JavaScript, and TypeScript depending on package.
- Match nearby naming, file layout, and test style instead of applying a single
  convention repo-wide.

## Finding The Right Package

- Ripple compiler lowering, analysis, or target semantics: `packages/tsrx-ripple/`
- Ripple runtime behavior, hydration, reactivity, DOM updates, or server output:
  `packages/ripple/`
- Ripple Vite, Rollup, or adapter behavior: the relevant retained package under
  `packages/`
- Ripple project generation: `packages/cli/`, `packages/create-ripple/`, and
  `templates/`
- Target-neutral TSRX parsing, diagnostics, formatting, linting, language-server
  behavior, editor integration, or non-Ripple targets: `tsrx-org/tsrx`

## Validation

Prefer the smallest validation that covers the touched surface.

Common workspace commands:

```bash
pnpm rules:generate
pnpm format:check
pnpm test
pnpm test --project ripple-client
pnpm test --project ripple-server
pnpm test --project ripple-hydration
pnpm test --project tsrx-ripple
pnpm typecheck
pnpm changeset:check
```

Ripple runtime suites use `.test.tsrx` files for many client, server, and
hydration tests. Tooling packages often use `.test.js` files.

## Changesets And Publishing

Add a changeset for user-facing package changes. Skip changesets for docs-only,
test-only, and internal tooling updates.

Only use `patch` changesets. Do not use `minor` or `major` bump types until a
release plan explicitly changes that policy.

```bash
pnpm changeset
pnpm changeset:check
```

Changesets discovers publishable packages from the pnpm workspace. Keep
non-publishable projects marked `private: true`, and use `.changeset/config.json`
for release grouping and temporary ignores. `@tsrx/ripple` remains the sole
`@tsrx`-scoped package published from this repository.

## Practical Guidance For Agents

- Prefer Ripple docs in `website/public/llms.txt` and target-neutral guidance at
  `tsrx.dev` over stale architectural summaries.
- Treat `@tsrx/core` and generic tooling as external published dependencies,
  including in tests and examples.
- Avoid copying removed compiler APIs, old package layouts, or legacy `.ripple`
  examples into new guidance.
- If exact behavior is unclear, read the owning retained package and its tests.
- Keep documentation updates short and durable. High-level guidance ages better
  than detailed internal call lists.
