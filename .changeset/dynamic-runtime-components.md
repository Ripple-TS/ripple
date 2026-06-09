---
"@tsrx/core": patch
"@tsrx/ripple": patch
"@tsrx/react": patch
"@tsrx/preact": patch
"@tsrx/solid": patch
"@tsrx/vue": patch
"@tsrx/prettier-plugin": patch
"ripple": patch
---

Replace the removed `<@...>` dynamic tag syntax with runtime `Dynamic` helpers. Ripple now exports `Dynamic` and reuses its composite runtime path for dynamic elements/components, while React, Preact, Solid, and Vue expose target-specific `Dynamic` helpers with typed `is` props.

React, Preact, Solid, and Vue now mark imported runtime `Dynamic` elements during shared JSX analysis so scoped CSS classes are applied through aliases without treating local components named `Dynamic` as runtime elements.

Dynamic component prop forwarding now uses a shared core runtime helper that excludes the internal `is` prop without snapshotting getter-backed reactive props.

The TSRX parser, transforms, analyzers, prettier support, and related tests no longer recognize dynamic tag syntax.
Stale JSX identifier `tracked` plumbing from that parser path has also been removed.
