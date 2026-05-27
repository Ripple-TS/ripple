---
"@tsrx/core": patch
"@tsrx/eslint-parser": patch
"@tsrx/eslint-plugin": patch
"@tsrx/bun-plugin-preact": patch
"@tsrx/preact": patch
"@tsrx/prettier-plugin": patch
"@tsrx/react": patch
"@tsrx/ripple": patch
"@tsrx/rspack-plugin-preact": patch
"@tsrx/vite-plugin-preact": patch
---

Parse tags and bare fragments as native TSRX by default, remove `component` keyword parsing, and compile/format/lint function components that return native TSRX across the React, Preact, and Ripple targets.
