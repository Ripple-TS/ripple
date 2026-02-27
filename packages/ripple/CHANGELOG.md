# ripple

## 0.2.216

### Patch Changes

- [#757](https://github.com/Ripple-TS/ripple/pull/757)
  [`9fb507d`](https://github.com/Ripple-TS/ripple/commit/9fb507d76af6fd6a5c636af1976d1e03d3e869ac)
  Thanks [@leonidaz](https://github.com/leonidaz)! - fixes compiler error that was
  generating async functions for call expressions inside if conditions when inside
  async context

- [#751](https://github.com/Ripple-TS/ripple/pull/751)
  [`e1de4bb`](https://github.com/Ripple-TS/ripple/commit/e1de4bb9df75342a693cda24d0999a423db05ec4)
  Thanks [@copilot-swe-agent](https://github.com/apps/copilot-swe-agent)! - Fix
  HMR "zoom" issue when a Ripple file is changed in the dev server.

  When a layout component contained children with nested `if`/`for` blocks,
  hydration would leave `hydrate_node` pointing deep inside the layout's root
  element (e.g. a HYDRATION_END comment inside `<main>`). The `append()`
  function's `parentNode === dom` check only handled direct children, so it missed
  grandchild/deeper positions and incorrectly updated the branch block's `s.end`
  to that deep internal node.

  This caused two problems on HMR re-render:
  1. `remove_block_dom(s.start, s.end)` removed wrong elements (the deep node was
     treated as a sibling boundary, causing removal of unrelated content including
     the root HYDRATION_END comment).
  2. `target = hydrate_node` (set after the initial render) became `null` or
     pointed outside the component's region, so new content was inserted at the
     wrong DOM location — producing a layout that appeared "zoomed" because it
     rendered outside its CSS container context.

  The fix changes the `parentNode === dom` check to `dom.contains(hydrate_node)`,
  consistent with the `anchor === dom` branch that already used `dom.contains()`.
  This correctly resets `hydrate_node` to `dom`'s sibling level regardless of how
  deeply nested it was inside `dom`.

- [#764](https://github.com/Ripple-TS/ripple/pull/764)
  [`95ea864`](https://github.com/Ripple-TS/ripple/commit/95ea8645b2cb27e2610a4ace4c8fb238c92d441a)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Fixes syntax color
  highlighting for `pending`

- Updated dependencies
  [[`9fb507d`](https://github.com/Ripple-TS/ripple/commit/9fb507d76af6fd6a5c636af1976d1e03d3e869ac),
  [`e1de4bb`](https://github.com/Ripple-TS/ripple/commit/e1de4bb9df75342a693cda24d0999a423db05ec4),
  [`95ea864`](https://github.com/Ripple-TS/ripple/commit/95ea8645b2cb27e2610a4ace4c8fb238c92d441a)]:
  - ripple@0.2.216

## 0.2.215

### Patch Changes

- [#742](https://github.com/Ripple-TS/ripple/pull/742)
  [`a9ecda4`](https://github.com/Ripple-TS/ripple/commit/a9ecda4e3f29e3b934d9f5ee80d55c059ba36ebe)
  Thanks [@copilot-swe-agent](https://github.com/apps/copilot-swe-agent)! - Fix
  catch block not executing when used with pending block in try statements.
  Previously, errors thrown inside async components within
  `try { ... } pending { ... } catch { ... }` blocks were lost as unhandled
  promise rejections. Now errors are properly caught and the catch block is
  rendered. Also fixes the server-side rendering to not include pending content in
  the final output when the async operation resolves or errors.

- [#744](https://github.com/Ripple-TS/ripple/pull/744)
  [`6653c5c`](https://github.com/Ripple-TS/ripple/commit/6653c5cebfbd4dce129906a25686ef9c63dc592a)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Fix compiler analysis
  incorrectly marking untrackable nodes as tracked. `MemberExpression` now only
  enables tracking when the member or its property is actually marked as
  `tracked`, and unconditional tracking side-effects were removed from
  `CallExpression` and `NewExpression` visitors.

  Also fixes the client transform for `TrackedExpression` in TypeScript mode to
  emit a `['#v']` member access (marked as `tracked`) instead of the runtime
  `_$_.get(...)` call, aligning TSX output with tracked-access semantics.

- [#733](https://github.com/Ripple-TS/ripple/pull/733)
  [`307dcf3`](https://github.com/Ripple-TS/ripple/commit/307dcf30f27dae987a19a59508cc2593c839eda3)
  Thanks [@trueadm](https://github.com/trueadm)! - Fix client HMR updates when a
  wrapped component has not mounted yet. The runtime now avoids calling `set()` on
  an undefined tracked source and keeps wrapper HMR state synchronized across
  update chains.
- Updated dependencies
  [[`a9ecda4`](https://github.com/Ripple-TS/ripple/commit/a9ecda4e3f29e3b934d9f5ee80d55c059ba36ebe),
  [`6653c5c`](https://github.com/Ripple-TS/ripple/commit/6653c5cebfbd4dce129906a25686ef9c63dc592a),
  [`307dcf3`](https://github.com/Ripple-TS/ripple/commit/307dcf30f27dae987a19a59508cc2593c839eda3)]:
  - ripple@0.2.215

## 0.2.214

### Patch Changes

- Updated dependencies []:
  - ripple@0.2.214

## 0.2.213

### Patch Changes

- Updated dependencies []:
  - ripple@0.2.213

## 0.2.212

### Patch Changes

- Fix hydration error when component is last sibling - added `hydrate_advance()`
  to safely advance hydration position at end of component content without
  throwing when no next sibling exists

- Updated dependencies []:
  - ripple@0.2.212

## 0.2.211

### Patch Changes

- [#694](https://github.com/Ripple-TS/ripple/pull/694)
  [`fa285f4`](https://github.com/Ripple-TS/ripple/commit/fa285f441ab8d748c3dfea6adb463e3ca6d614b5)
  Thanks [@trueadm](https://github.com/trueadm)! - Add a compiler validation error
  for rendering `children` through text interpolation (for example `{children}` or
  `{props.children}`) and direct users to render children as a component
  (`<@children />`) instead.
- Updated dependencies
  [[`fa285f4`](https://github.com/Ripple-TS/ripple/commit/fa285f441ab8d748c3dfea6adb463e3ca6d614b5)]:
  - ripple@0.2.211

## 0.2.210

### Patch Changes

- Fix npm OIDC publishing workflow

- Updated dependencies []:
  - ripple@0.2.210

## 0.2.209

### Patch Changes

- [#682](https://github.com/Ripple-TS/ripple/pull/682)
  [`96a5614`](https://github.com/Ripple-TS/ripple/commit/96a56141de8aa667a64bf53ad06f63292e38b1d9)
  Thanks [@copilot-swe-agent](https://github.com/apps/copilot-swe-agent)! - Add
  invalid HTML nesting error detection during SSR in dev mode

  During SSR, if the HTML is malformed (e.g., `<button>` elements nested inside
  other `<button>` elements), the browser tries to repair the HTML, making
  hydration impossible. This change adds runtime validation of HTML nesting during
  SSR to detect these cases and provide clear error messages.
  - Added `push_element` and `pop_element` functions to the server runtime that
    track the element stack during SSR
  - Added comprehensive HTML nesting validation rules based on the HTML spec
  - The server compiler now emits `push_element`/`pop_element` calls when the
    `dev` option is enabled
  - Added `dev` option to `CompileOptions`
  - The Vite plugin now automatically enables dev mode during `vite dev` (serve
    command)

- [#683](https://github.com/Ripple-TS/ripple/pull/683)
  [`ae3aa98`](https://github.com/Ripple-TS/ripple/commit/ae3aa981515f81e62a699497e624dd0c2e3d2c91)
  Thanks [@WebEferen](https://github.com/WebEferen)! - Fix SSR hydration output
  for early-return guarded content by emitting hydration block markers around
  return-guarded regions, and add hydration/server coverage for early return
  scenarios.
- Updated dependencies
  [[`96a5614`](https://github.com/Ripple-TS/ripple/commit/96a56141de8aa667a64bf53ad06f63292e38b1d9),
  [`ae3aa98`](https://github.com/Ripple-TS/ripple/commit/ae3aa981515f81e62a699497e624dd0c2e3d2c91)]:
  - ripple@0.2.209
