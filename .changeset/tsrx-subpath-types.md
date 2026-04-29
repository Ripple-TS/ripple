---
'@tsrx/core': patch
'@tsrx/react': patch
'@tsrx/preact': patch
'@tsrx/vue': patch
---

Add type declarations for the `./merge-refs` and `./error-boundary` subpath
exports of `@tsrx/react`, `@tsrx/preact`, and `@tsrx/vue`, and for
`@tsrx/core/runtime/merge-refs`. Previously these subpaths only declared a
`default` export, so under `node16`/`nodenext`/`bundler` resolution TypeScript
could not pick up types for `import { mergeRefs } from '@tsrx/react/merge-refs'`
or the `TsrxErrorBoundary` re-exports.
