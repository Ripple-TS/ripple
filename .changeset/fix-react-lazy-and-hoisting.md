---
'@tsrx/react': patch
---

Fix static hoisting incorrectly hoisting elements that reference component-scope bindings as JSX tag names (including JSXMemberExpression objects like `<ui.Button />`), and fix lazy destructuring transforms incorrectly rewriting references to block-scoped variables that shadow lazy binding names
