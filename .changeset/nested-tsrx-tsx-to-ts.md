---
"@tsrx/ripple": patch
"ripple": patch
"@ripple-ts/vscode-plugin": patch
---

Fix to_ts output for nested `<tsrx>` islands inside `<tsx>` blocks.

Type JSX expression values as `TSRXElement` so IntelliSense reports assigned
TSX/TSRX fragments as renderable values instead of `void`.

Fix TextMate highlighting for nested `<tsrx>` and `<tsx>` tags inside JSX
expression containers.
