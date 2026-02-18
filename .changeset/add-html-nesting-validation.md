---
'ripple': patch
'@ripple-ts/vite-plugin': patch
---

Add invalid HTML nesting error detection during SSR in dev mode

During SSR, if the HTML is malformed (e.g., `<button>` elements nested inside
other `<button>` elements), the browser tries to repair the HTML, making hydration
impossible. This change adds runtime validation of HTML nesting during SSR to
detect these cases and provide clear error messages.

- Added `push_element` and `pop_element` functions to the server runtime that
  track the element stack during SSR
- Added comprehensive HTML nesting validation rules based on the HTML spec
- The server compiler now emits `push_element`/`pop_element` calls when the `dev`
  option is enabled
- Added `dev` option to `CompileOptions`
- The Vite plugin now automatically enables dev mode during `vite dev` (serve
  command)
