---
'@tsrx/rspack-plugin-solid': patch
---

Add a Solid Rspack plugin that compiles `.tsrx` with `@tsrx/solid`, runs the
final TypeScript + JSX transform through Babel, and extracts component-local
`<style>` blocks through Rspack's CSS pipeline.
