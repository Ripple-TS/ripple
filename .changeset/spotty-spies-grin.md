---
'@tsrx/core': patch
---

fix(parser): keep significant whitespace before a `@{ … }` code block

The native template body skipped leading whitespace when repositioning onto a
`@{ … }` code block, so `<>   @{<b>123</b>}   </>` lost its leading edge space
(only the trailing one survived). The whitespace is now emitted as a text child,
matching the equivalent plain-element case; layout indentation (whitespace
containing a newline) is still dropped.
