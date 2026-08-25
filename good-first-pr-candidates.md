# Ripple — Good First PR Candidates

This list covers Ripple-owned runtime, target compiler, adapter, scaffolding,
website, and integration work. Target-neutral TSRX syntax, compiler-core,
formatter, linter, language-server, grammar, and editor-plugin work belongs in
[tsrx-org/tsrx](https://github.com/tsrx-org/tsrx).

## How to validate before opening a PR

- Run `pnpm format:check`.
- Run the smallest relevant project, such as `pnpm test --project ripple-client`
  or `pnpm test --project ripple-server`.
- Run `pnpm typecheck` for source changes.
- Add a patch changeset only for user-facing package changes.

## Small documentation and comment fixes

| Location                                                                          | Candidate                                                                    |
| --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `website/docs/guide/control-flow.md` and `website-new/docs/guide/control-flow.md` | Change “Each `and` has its own body” to “Each `case` has its own body.”      |
| `website/docs/guide/events.md` and `website-new/docs/guide/events.md`             | Correct “exluding” to “excluding.”                                           |
| `website/docs/guide/reactivity.md` and `website-new/docs/guide/reactivity.md`     | Change “when need top performance” to “when you need top performance.”       |
| `packages/ripple/src/runtime/internal/client/render.js`                           | Correct the duplicated word in “if the the value.”                           |
| `packages/ripple/src/runtime/internal/server/index.js`                            | Correct the duplicated words in “stream stream” and “send sent.”             |
| `packages/ripple/tests/client/array/array.static.test.tsrx`                       | Clarify the TODO about non-template use.                                     |
| `packages/tsrx-ripple/src/analyze/index.js`                                       | Change “must have only contain text nodes” to “can only contain text nodes.” |
| `packages/create-ripple/README.md`                                                | Align the documented Node.js requirement with `package.json`.                |
| `templates/basic/README.md`                                                       | Point “Ripple Documentation” to the documentation site.                      |

## Larger Ripple-owned candidates

- Fix the broken `#Props-and-Attributes` anchor in both Ripple documentation
  trees.
- Verify and update the old `ripplejs-router` link in the libraries page.
- Investigate the skipped streaming SSR hydration suites under
  `packages/ripple/tests/hydration/`.
- Replace the placeholder error in
  `packages/tsrx-ripple/src/transform/client/index.js` with a descriptive
  Ripple-target compiler diagnostic.

For larger work, select a current Ripple runtime, SSR, hydration, adapter, CLI, or
Ripple-target compiler issue and comment your intent before starting.
