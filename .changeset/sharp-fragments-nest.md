---
'@tsrx/core': patch
---

Parser fix for fragment expression values inside JSX attribute objects/arrays. Previously the leaked `tc_expr, b_stat` token contexts after a fragment caused the next entry's `<` to be tokenized as a TS relational operator instead of `jsxTagStart`. Affected shapes:

- `params={{ list: [<>A</>, <>B</>] }}` (multi-fragment array as object property)
- `params={{ a: <>X</>, b: ... }}` (fragment as object property followed by another property)
- `params={{ list: [<><span>A</span></>, <><span>B</span></>] }}` (same shapes with fragments containing child elements)
