---
"@tsrx/rspack-plugin-react": patch
---

Add `@tsrx/rspack-plugin-react`, an Rspack plugin for `.tsrx` modules that
compiles them via `@tsrx/react` and then delegates the final JSX transform to
rspack's `builtin:swc-loader`. Per-component `<style>` blocks are imported via
a sibling `?tsrx-css&lang.css` query and handled by rspack's built-in CSS
module type.
