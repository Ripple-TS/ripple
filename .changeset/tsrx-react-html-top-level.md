---
'@tsrx/react': patch
---

Fix silent failure when `{html expr}` appears at the component body level
(outside any element) on the React target. `is_jsx_child` was missing the
`'Html'` node type, so the node was incorrectly classified as a non-JSX
statement and landed in the function body as an invalid AST node instead
of surfacing the "not supported on the React target" compile error.
