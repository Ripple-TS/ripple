---
'@tsrx/core': patch
'@tsrx/ripple': patch
---

Preserve significant whitespace and keep fragments faithful in TSRX template
output.

- Parser: a sibling after a closing tag (`<b>1</b> 2`, `<> <>x</> y <>z</> </>`)
  now reads as JSX text at the source, so significant inline whitespace is kept
  instead of being eaten by `skipSpace`. This fixes the leading space being
  dropped (`" 2 "` not `"2 "`) and removes several closing-tag whitespace/context
  workarounds.
- Transform: a single-text fragment used as a JSX child stays a fragment
  (`<>123</>` instead of `{'123'}`), and an empty fragment child stays `<></>`
  instead of `{null}`. Expression/return-position single-text fragments still
  lower to a string (`return <>x</>` -> `return "x"`). Whitespace at a
  fragment/element's content edges is wrapped in a `{' '}` container so it survives
  formatting/JSX collapsing; whitespace between siblings stays bare
  (`<b/> <i/>`). The edge rule is shared (`wrapEdgeWhitespace`) across the
  React/Preact/Solid transforms and the Ripple to_ts view.
- Ripple target: whitespace-only text that is a significant inline space is kept
  rather than dropped, so edge and inter-element spaces survive in client
  templates and SSR output. The to_ts / Volar type-checking view now matches the
  JSX targets — literal text stays bare (not `{"123"}`), single-text fragments
  stay `<>123</>`, empty fragments stay `<></>` (not `{null}`), `{a}` expression
  containers are preserved for type visibility, and edge whitespace prints as
  single-quote `{' '}`.
