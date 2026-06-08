---
'@ripple-ts/vscode-plugin': patch
---

Fix TSRX syntax highlighting for directive control-flow keywords in expression positions and editor grammar assets. Directives such as `@switch`, `@case`, `@default`, `@empty`, `@pending`, `@catch`, and `@else if` now receive consistent keyword coloring, and statement-container fences keep directive coloring.
