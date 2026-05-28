---
"@tsrx/core": patch
"@tsrx/eslint-parser": patch
"@tsrx/eslint-plugin": patch
"@tsrx/bun-plugin-solid": patch
"@tsrx/bun-plugin-preact": patch
"@tsrx/bun-plugin-vue": patch
"@tsrx/preact": patch
"@tsrx/prettier-plugin": patch
"@tsrx/react": patch
"@tsrx/ripple": patch
"ripple": patch
"@tsrx/rspack-plugin-solid": patch
"@tsrx/rspack-plugin-preact": patch
"@tsrx/rspack-plugin-vue": patch
"@tsrx/solid": patch
"@tsrx/vue": patch
"@tsrx/vite-plugin-solid": patch
"@tsrx/vite-plugin-preact": patch
"@tsrx/vite-plugin-vue": patch
---

Parse tags and bare fragments as native TSRX by default, remove `component` keyword parsing, and compile/format/lint function components that return native TSRX across the React, Preact, Solid, Vue, and Ripple targets. Ripple component compilation now only renders TSRX reachable from returned values and supports string and `null` component returns.

Ripple now also preserves directly called PascalCase helpers as ordinary functions while still compiling renderable component functions used as components or render entries.

The old explicit TSRX wrapper tag is no longer special; TSRX elements and fragments are the default expression syntax, and the tag name is treated like any ordinary element name.

Ripple now exports a typed `Fragment` helper from its public runtimes and supports `innerHTML` on both host elements and `Fragment`. Ripple also treats `innerHTML` from element spreads as rendered content instead of serializing it as an `innerhtml` attribute.

The `{html ...}` template directive has been removed. Use each target's native raw HTML prop instead, such as `innerHTML` for Ripple/Solid/Vue or `dangerouslySetInnerHTML` for React/Preact.

The `{text ...}` template directive has also been removed. Text values now use ordinary `{expr}` containers, with explicit coercion written as JavaScript (`String(value)`, `value + ''`, or a typed string value). Ripple optimizes clearly string-shaped expressions and typed string props into text-node updates without requiring a TSRX-specific directive.
