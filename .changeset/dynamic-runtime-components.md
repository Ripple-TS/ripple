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

The TSRX parser, transforms, analyzers, prettier support, and related tests no longer recognize dynamic tag syntax.
