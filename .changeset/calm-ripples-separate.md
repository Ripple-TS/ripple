---
'@ripple-ts/cli': patch
'@ripple-ts/vite-plugin': patch
'@tsrx/ripple': patch
ripple: patch
---

Consume the shared TSRX compiler and tooling from their published packages after
moving target-neutral source to `tsrx-org/tsrx`. New Ripple projects now use the
`@tsrx/language-server`, TSRX editor identity, and published TSRX integrations.
