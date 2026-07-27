---
'@tsrx/core': patch
'@tsrx/preact': patch
'@tsrx/react': patch
'@tsrx/solid': patch
'@tsrx/vue': patch
---

Replace every `any` in `@tsrx/solid`, `@tsrx/vue`, `@tsrx/react` and `@tsrx/preact` with the real AST, compiler and framework types, and move each package's `@typedef` blocks into its `types/` declarations.

`@tsrx/solid`'s transform carried the bulk of it: all 126 `any` annotations are gone, replaced by the parser's AST types plus a new `types/transform.d.ts` describing the shapes the Solid lowering passes around (`SolidRenderSource`, `SolidIfBranch`, `SolidLoweredList`, `SolidBranchArrow`, …). `is_solid_render_child` and `is_branch_arrow` are now type predicates, `to_jsx_child` declares that a render source always lowers to a JSX child, and the hand-built `JSXElement`/`JSXAttribute` object literals are built through the shared builders instead — so generated attributes carry the `shorthand` field the type requires. The two places where a statement list is still mid-lowering go through `lowered_block`/`lowered_switch_case`, which name that invariant instead of hiding it behind `any`. Three unreachable helpers (`get_if_consequent_body`, `negate_expression`, `TEMPLATE_FRAGMENT_ERROR`) were dropped.

`@tsrx/vue`'s error boundary no longer casts the `vue` namespace to `any` at every call: the Vapor renderer's runtime-internal helpers are declared once in `types/vapor-runtime.d.ts` (`VaporRuntime`, `VaporBlock`, `VaporFragment`, `VaporComponentInstance`), the namespace is narrowed to that interface a single time, and `EffectScope` comes from `vue`'s own published export. `TsrxErrorBoundaryProps` describes its render callbacks as returning `unknown` rather than `any`, matching what the boundary actually does with them.

The React and Preact error boundaries declare their props and state through `TsrxErrorBoundaryProps`/`TsrxErrorBoundaryState` instead of an `any` constructor parameter, Preact's `CompileOptions` typedef moved from `src/transform.js` to `types/index.d.ts` where the declaration already lived, and all four `compile` entry points return the shared `CompileResult` (a typed `map`) instead of an inline shape with `map: any`.

`@tsrx/core`'s `BaseNodeMetaData` declares the two flags Solid's transform sets (`solid_render_control`, `is_branch_arrow`), alongside the Vue-specific flags already there.
