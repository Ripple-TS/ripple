---
'@tsrx/core': patch
---

Fix parsing of sibling fragments/elements separated by template text. A `<>` or
`<tag>` opening that follows template text (e.g. `<> <></> 2 <></> </>`) arrives
as a relational `<` token; the JSX re-entry fallback now pushes the same
tokenizer contexts a real `jsxTagStart` would, so the terminating `>` — including
the lone `>` of a nameless fragment — is read as `jsxTagEnd` instead of a
relational operator. Also preserve an inline space that separates two sibling
elements on the same line (`<> <></>  <></>x </>`) as significant JSX text;
only layout whitespace spanning a newline is still collapsed.
