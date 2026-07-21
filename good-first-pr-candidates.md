# Ripple — Good First PR Candidates (new external contributor)

Compiled by a swarm of subagents + GitHub issue scan on 2026-07-17. Repo:
Ripple-TS/ripple (https://github.com/Ripple-TS/ripple) Conventions: current
authoring format is `.tsrx` (directives `@if`/`@for`/`@switch`/`@try`), not legacy
`.ripple`.

## How to validate before opening a PR

- `pnpm format:check` and `pnpm format`
- `pnpm test --project ripple-client` / `pnpm test --project ripple-server`
- `pnpm typecheck`
- Add a changeset ONLY for user-facing package changes (`pnpm changeset`), patch
  only.

---

## Tier 1 — Trivial, single-string/comment fixes (ideal first PRs)

| #   | Location                                                        | What                                                                                    |
| --- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| 1   | `website/docs/guide/control-flow.md:64` (+ website-new)         | "Each `and` has its own body" → should be "Each `case`"                                 |
| 2   | `website/docs/guide/events.md:230` (+ website-new)              | "exluding" → "excluding"                                                                |
| 3   | `website/docs/guide/reactivity.md:56` (+ website-new)           | "when need top performance" → "when you need top performance"                           |
| 4   | `packages/ripple/src/runtime/internal/client/render.js:178`     | comment "if the the value" → "if the value"                                             |
| 5   | `packages/ripple/src/runtime/internal/server/index.js:1153-54`  | "stream stream" + "send sent" doubled-word typos in comment                             |
| 6   | `packages/tsrx-ripple/src/analyze/index.js:2431`                | error msg "`<title>` must have only contain text nodes" → "can only contain text nodes" |
| 7   | `packages/tsrx/src/transform/jsx/index.js:3842`                 | JSDoc "for for-of loops" → "for `for-of` loops"                                         |
| 8   | `packages/prettier-plugin/src/index.test.js:6292`               | test title "one or more exits" → "exists"                                               |
| 9   | `packages/ripple/tests/client/array/array.static.test.tsrx:113` | broken TODO comment grammar "being using in a not template way"                         |
| 10  | `templates/basic/package.json:28`                               | `"vite": "^8.0.0 "` trailing space                                                      |

## Tier 2 — Easy, small but need a judgment call

| #   | Location                                                  | What                                                                                               |
| --- | --------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| 11  | `website/docs/quick-start.md:81` (+ website-new)          | Sublime step says "Upgrade Package" → should be "Install Package" (copy-paste bug)                 |
| 12  | `packages/vscode-plugin/package.json:26`                  | `repository.directory` "vscode-plugin" → "packages/vscode-plugin" (all 37 siblings use the prefix) |
| 13  | `packages/create-ripple/README.md:67`                     | Node version says "20.0.0 or higher" but package.json requires `>=22.0.0`                          |
| 14  | `CONTRIBUTING.md:5`                                       | describes `.ripple` as current format; should be `.tsrx`                                           |
| 15  | `packages/eslint-plugin/README.md:1`                      | H1 `# @tsrx/eslint-plugin` vs published `@ripple-ts/eslint-plugin` in badges                       |
| 16  | `packages/tsrx-ripple/src/transform/client/index.js:3244` | `throw new Error('TODO')` → descriptive message                                                    |

## Tier 3 — Stale `ripplejs.com` → `ripple-ts.com` (batch into ONE clean PR)

| #   | Location                                   | What                      |
| --- | ------------------------------------------ | ------------------------- |
| 17  | `README.md:1`                              | hero link `ripplejs.com`  |
| 18  | `CONTRIBUTING.md:22`                       | `ripplejs.com/playground` |
| 19  | `packages/eslint-plugin/README.md:6, :220` | two `ripplejs.com` links  |
| 20  | `grammars/tree-sitter/README.md:3`         | `ripplejs.com`            |

## Tier 4 — Small metadata / doc polish

| #   | Location                                   | What                                                                 |
| --- | ------------------------------------------ | -------------------------------------------------------------------- |
| 21  | `zed-plugin/package.json:10`               | license "ISC" → "MIT" (repo-wide); also empty `description`/`author` |
| 22  | `sublime-text-plugin/package.json:4`       | empty `description`, missing `keywords`                              |
| 23  | `packages/language-server/README.md:32-34` | missing period after extension link                                  |
| 24  | `templates/basic/README.md:48`             | "Ripple Documentation" links to repo, not docs site                  |

## Moderate (bigger effort — not the smallest first PR)

- Playground READMEs (`playground/react|solid|vue/README.md`) teach stale inline
  control-flow syntax instead of `@if`/`@for` directives — impactful but a bigger
  rewrite.
- `website/docs/guide/components.md:220` broken anchor `#Props-and-Attributes`.
- `website/docs/libraries.md:14` `ripplejs-router` old-branding link (verify live
  repo first).
- 3 `describe.skip` streaming-SSR hydration suites
  (`ripple/tests/hydration/try.test.js:132`, `nested-control-flow.test.js:157`,
  `mixed-control-flow.test.js:70`) — real but touches runtime.

---

## GitHub Issues (no good-first-issue/help-wanted/docs labels exist; 26 open issues reviewed)

Mostly large features or deep compiler bugs. These 4 are well-scoped "add a
warning" tasks suitable for a first contributor:

| Issue | Title                                                                                  | Why beginner-friendly                                  |
| ----- | -------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| #1226 | Warn when TSRX fragments aren't returned (free-floating `@if`/`@for` outside a return) | Sharp spec w/ example; localized diagnostic            |
| #1261 | Warn when a `@{}` code block holds only a statement                                    | Sharp, concrete; string-interpolation guidance message |
| #1237 | Warn when assigned `<style>` uses non-standalone selectors                             | Localized warning + optional emit change               |
| #367  | Warn about invalid HTML (e.g. nested `<p>`) in DEV/SSR                                 | Slightly bigger but bounded to a validator             |

## Recommended starting points

- Lowest friction: any Tier-1 typo or the Tier-3 `ripplejs.com` link-batch (fast
  merge, zero review risk).
- Most "real contributor" feeling: claim #1226 or #1261 (add a diagnostic) and
  comment intent — not assigned yet.
