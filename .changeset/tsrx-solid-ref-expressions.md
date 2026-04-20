---
'@tsrx/solid': patch
---

Support `{ref expr}` on composite components and allow multiple `{ref ...}`
attributes on the same element. On DOM elements, `{ref expr}` now compiles
to `ref={expr}` directly, leveraging Solid's JSX transform for both variable
assignment (`let el; {ref el}`) and callback invocation (`{ref fn}`). On
composite components, the ref is passed through as a regular prop, so
spreading `{...props}` onto a DOM element inside the child wires it through
automatically via Solid's spread runtime. Multiple refs on the same target
compile to a `ref={[a, b, ...]}` array so every callback fires.
