---
'@tsrx/core': patch
'@tsrx/ripple': patch
'ripple': patch
---

Add a static `@Component` decorator marker for Ripple component functions, and
treat Ripple functions as components only when they return TSRX directly or use
that marker. Function decorators are parsed as generic Decorator AST nodes before
target-specific transforms interpret them.
