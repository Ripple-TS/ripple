---
'@tsrx/core': patch
'@tsrx/ripple': patch
---

Prune unreachable selectors from variable-assigned `<style>` blocks. A style
expression (`const styles = <style> … </style>`) only exposes standalone class
selectors through its generated class map, but the emitted CSS still contained
every selector — element selectors, compound selectors, and descendant chains
that no element could ever match. Those top-level selectors are now commented
out as unused, while standalone classes, `:global(…)` selectors, and rules
nested inside a reachable rule (e.g. `&:hover`) are kept. Free-standing
`<style>` blocks are unaffected.
