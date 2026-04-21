# @tsrx/solid

## 0.0.3

### Patch Changes

- [#888](https://github.com/Ripple-TS/ripple/pull/888)
  [`ad99739`](https://github.com/Ripple-TS/ripple/commit/ad99739f65202850ff0013515121cfd3a1758b82)
  Thanks [@trueadm](https://github.com/trueadm)! - Wrap element children that mix
  JSX with plain statements (`VariableDeclaration`, `ExpressionStatement`,
  `DebuggerStatement`, etc.) in an IIFE so the statements execute as JS during
  render and keep their locals scoped to the enclosing element. Previously those
  statements were emitted directly as JSX children, which made them render as
  literal text rather than run — e.g. mid-template
  `const [state, setState] = createSignal()` or `console.log(...)` between JSX
  siblings printed their source instead of executing. Matches the React target's
  existing behaviour.

## 0.0.2

### Patch Changes

- [#885](https://github.com/Ripple-TS/ripple/pull/885)
  [`34d64e5`](https://github.com/Ripple-TS/ripple/commit/34d64e5028aee91a22a1cd1d8490c1c64105a7cd)
  Thanks [@trueadm](https://github.com/trueadm)! - Target Solid 2.0 beta. The
  Solid transform now emits `<Errored>` / `<Loading>` instead of `<ErrorBoundary>`
  / `<Suspense>` (renamed in Solid 2.0 core). The Vite plugin re-anchors virtual
  `.tsrx.tsx` ids when the host bundler strips the workspace root (e.g. Vitest
  test entries). A new `tsrx-solid-runtime` Vitest project runs Solid components
  end-to-end in jsdom, mirroring the existing React runtime test matrix.

- [#885](https://github.com/Ripple-TS/ripple/pull/885)
  [`34d64e5`](https://github.com/Ripple-TS/ripple/commit/34d64e5028aee91a22a1cd1d8490c1c64105a7cd)
  Thanks [@trueadm](https://github.com/trueadm)! - `{html expr}` now compiles on
  the Solid target to an `innerHTML={expr}` attribute on the parent element,
  matching Solid's native raw-HTML primitive. Only one `{html ...}` is permitted
  per element, and it cannot share the element with sibling children — both cases
  produce a helpful compile-time error.

  On the React target, `{html ...}` now raises an explicit compile-time error
  pointing at `dangerouslySetInnerHTML`. Previously it failed with a generic
  astring "Not implemented: Html" message.

- [#885](https://github.com/Ripple-TS/ripple/pull/885)
  [`34d64e5`](https://github.com/Ripple-TS/ripple/commit/34d64e5028aee91a22a1cd1d8490c1c64105a7cd)
  Thanks [@trueadm](https://github.com/trueadm)! - Drop `{html expr}` support on
  the Solid target. It used to lower to a Solid `innerHTML={...}` attribute, but
  `innerHTML` is element-level (it replaces all children and has no meaning on
  composite components) so the implicit lowering from a child container was
  error-prone. Compiling `{html ...}` with `@tsrx/solid` is now a compile-time
  error that points users at `innerHTML={...}` as an explicit element attribute.
  This matches the `@tsrx/react` behaviour; only Ripple has a first-class
  `{html ...}` primitive.

- [#885](https://github.com/Ripple-TS/ripple/pull/885)
  [`34d64e5`](https://github.com/Ripple-TS/ripple/commit/34d64e5028aee91a22a1cd1d8490c1c64105a7cd)
  Thanks [@trueadm](https://github.com/trueadm)! - Support `{ref expr}` on
  composite components and allow multiple `{ref ...}` attributes on the same
  element. On DOM elements, `{ref expr}` now compiles to `ref={expr}` directly,
  leveraging Solid's JSX transform for both variable assignment
  (`let el; {ref el}`) and callback invocation (`{ref fn}`). On composite
  components, the ref is passed through as a regular prop, so spreading
  `{...props}` onto a DOM element inside the child wires it through automatically
  via Solid's spread runtime. Multiple refs on the same target compile to a
  `ref={[a, b, ...]}` array so every callback fires.

- [#885](https://github.com/Ripple-TS/ripple/pull/885)
  [`34d64e5`](https://github.com/Ripple-TS/ripple/commit/34d64e5028aee91a22a1cd1d8490c1c64105a7cd)
  Thanks [@trueadm](https://github.com/trueadm)! - When `{text expr}` is the sole
  child of a host (DOM) element, hoist it to a `textContent={expr}` attribute on
  the parent. Solid writes `textContent` as a direct DOM property, which skips the
  `insert()`-based text-node binding it would otherwise emit for a child
  expression. The optimization only applies to host elements (composite components
  don't have a DOM `textContent`) and bails out if the user has already set
  `textContent` explicitly or if there are sibling children (since `textContent`
  replaces all other content).
