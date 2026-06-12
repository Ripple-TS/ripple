---
'@tsrx/core': patch
'@tsrx/ripple': patch
---

Prune unreachable selectors from variable-assigned `<style>` blocks. A style
expression (`const styles = <style> … </style>`) only exposes standalone class
selectors through its generated class map — scoped (`.x`) or global-wrapped
(`:global(.x)`) — but the emitted CSS still contained every selector: element
selectors, compound selectors, descendant chains, and global tag selectors that
nothing reachable through the class map could ever match. Top-level selectors
that don't contribute a class map entry are now commented out as unused, while
standalone classes, `:global(.x)` selectors, and rules nested inside a
reachable rule (e.g. `&:hover`) are kept. Free-standing `<style>` blocks keep
the existing behavior.
