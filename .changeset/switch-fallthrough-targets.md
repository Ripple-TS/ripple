---
'@tsrx/core': patch
'@tsrx/react': patch
'@tsrx/preact': patch
'@tsrx/solid': patch
'@tsrx/vue': patch
---

Support JavaScript `switch` fall-through semantics in component templates across the React, Preact, Solid, and Vue targets. When a `case` body has no `break` (or terminal `return`), each entry case now renders its own body plus every downstream body it would have fallen into — matching JS spec and the existing Ripple runtime behavior.

All four targets reuse the same `create_hook_safe_helper` lift that hook-bearing case bodies already go through, orchestrated by a shared `plan_switch_lift` planner exported from `@tsrx/core`. Any case body that appears in more than one arm after fall-through analysis is hoisted into its own `StatementBodyHook` helper component, and each upstream arm chains into the next helper at the end of its body. Each case body therefore appears exactly once in the generated module regardless of how many arms reach it, keeping bundle size linear in case count and source mappings 1:1 for editor IntelliSense. Cases that terminate with `break` (or aren't reached via fall-through) stay inline as before.

- **React, Preact, Vue** keep the JS `switch` and emit case arms that `return <Helper/>` for lifted bodies; inline arms append `<NextHelper/>` as the chain entry point.
- **Solid** lowers each entry case to a `<Match>` whose body is the lifted helper element, or for inline arms a fragment of the inline JSX plus a chain `<NextHelper/>`.

Vue's and Solid's client transforms now hoist all `StatementBodyHook` helpers — not just the fall-through ones — to module scope (Vue wraps each in `defineVaporComponent`). Every control flow that already went through the lift on React (hook-bearing `if`, `switch`, `try`, and `for-of` bodies) now produces a single top-level helper instead of a per-render lazy initializer. `compile_to_volar_mappings` opts back out via `moduleScopedHookComponents: false` so Volar's virtual TSX keeps helpers local — closure-captured bindings stay resolvable against the component body for type checking.

Create map helper functions for for-of loops to be used in the future transforms
