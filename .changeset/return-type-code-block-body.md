---
"@tsrx/core": patch
---

Fix parsing of a `@{ … }` code-block body that follows a function return-type annotation, e.g. `function App(): JSX.Element @{}`. The return type was parsed inside acorn-typescript while still in type-tokenizer mode, so the trailing `@` threw "Unexpected character '@'" before the code block could be recognized. The return type is now parsed before the body is inspected, and `@` is tokenized in type mode, so typed functions, methods, anonymous function expressions, and generic signatures all accept a `@{ … }` body.
