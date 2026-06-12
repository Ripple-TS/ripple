---
'@tsrx/core': patch
'@tsrx/ripple': patch
---

Prune unreachable selectors from `<style>` blocks consistently across targets.

For a style expression (`const styles = <style> … </style>`), only standalone
class selectors — scoped (`.x`) or global-wrapped (`:global(.x)`) — end up in
the generated class map, but the emitted CSS still contained every selector.
Top-level selectors that don't contribute a class map entry (element selectors,
compound selectors, descendant chains, global tag selectors) are now commented
out as unused, while standalone classes, `:global(.x)` selectors, and rules
nested inside a reachable rule (e.g. `&:hover`) are kept.

Free-standing `<style>` blocks in the shared JSX targets (react, preact, solid,
vue) now prune selectors that match no element, the same way the Ripple target
always has, instead of keeping every authored selector. Selector matching also
recognizes `className` as the class attribute for React-style targets.
