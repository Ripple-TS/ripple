---
'@tsrx/core': patch
'@tsrx/react': patch
'@tsrx/preact': patch
'@tsrx/solid': patch
'@tsrx/vue': patch
---

Stop emitting a duplicate source mapping for the synthesized attribute name
when shorthand JSX attributes (`<X {count} />`) are expanded to longhand
(`<X count={count} />`). The generated `count=` does not exist in the source,
so it should not carry a source mapping; previously editors showed duplicate
hover/intellisense popups on the same `{count}` span.
