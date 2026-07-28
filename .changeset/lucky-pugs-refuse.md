---
'@tsrx/prettier-plugin': patch
'@tsrx/core': patch
---

fix: stop dropping decorators when formatting

The printer had no decorator handling at all, so formatting silently deleted every
`@decorator` in a `.tsrx` file — on class declarations, methods, fields, accessors,
and parameters alike. Decorators have runtime effects, so this changed what the
code did.

All four positions now round-trip, following prettier's line breaking: class
decorators each take their own line, class member decorators keep the lines they
were written with (and an inline decorator too long to share the member's line
moves to its own), and parameter decorators stay inline. Decorators on an exported
class print above the `export` keyword, and a parameter property's decorators print
before its modifiers. `@tsrx/core`'s AST types now carry the `Decorator` node the
printer needs.
