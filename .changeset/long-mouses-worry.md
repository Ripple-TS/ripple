---
'ripple': patch
'@ripple-ts/compat-react': patch
'@ripple-ts/prettier-plugin': patch
'@ripple-ts/language-server': patch
'@ripple-ts/vscode-plugin': patch
---

Add a release changeset for the async tracking work introduced in commit
`4eb4d6851573d771d65f1e85b1b442ad3cdc53d2`.

This ships async tracking as a first-class feature in Ripple:

- remove and prohibit direct component-level `await`; async component flows now
  require using `trackAsync()` (with `trackPending()` for pending state checks)
- add `trackAsync()` and `trackPending()` support so async values can be read
  through Ripple's reactive runtime using tracked async values
- update compiler/runtime behavior for `try`/`catch`/`pending` boundaries so
  async pending and error states can render and recover correctly in client and
  SSR paths
- align `@ripple-ts/compat-react` async boundary behavior with the new Ripple
  async tracking semantics
- update editor/tooling integration to match the new async syntax/runtime shape
