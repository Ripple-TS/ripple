---
'@tsrx/core': patch
---

fix(parser): recognize control-flow directives inside element-valued attribute expressions

JSX inside an attribute-value `{ … }` container now parses through the TSRX
template path, so `prop={<h1>@if (ok) { … } @else { … }</h1>}` behaves the same
as assigning the element to a variable first. Previously the directive was
either kept as literal text or — when no whitespace preceded the `@` — re-parsed
into an untransformed directive node that crashed the printer.

Also fixes template text loss around directives: text (and significant inline
whitespace) preceding a directive or an `=` was silently dropped in
container-nested elements, and inline spaces between a sibling element and a
directive were dropped inside `@switch` bodies and value-position directives
(`const v = @if …`). Sibling whitespace now survives uniformly, matching how
the browser renders it; newline-containing layout indentation is still removed.
