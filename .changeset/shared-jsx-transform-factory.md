---
'@tsrx/core': patch
'@tsrx/react': patch
'@tsrx/preact': patch
'@tsrx/solid': patch
---

Extract JSX-emitting targets into a shared `createJsxTransform` factory in `@tsrx/core`; React, Preact, and Solid now plug in via a `JsxPlatform` descriptor so source-mapping fixes propagate to all three targets.

- `@tsrx/core` adds the `createJsxTransform` factory, `JsxPlatform` / `JsxPlatformHooks` / `JsxTransformResult` types, and a shared test harness at `@tsrx/core/test-harness/source-mappings`. The source-map segments walker now handles `TSTypePredicate` and uses strict mapping lookups throughout.
- `compile_to_volar_mappings` no longer crashes on common AST shapes across all three targets: `NewExpression`, `ReturnStatement`, `ForStatement` / `ForInStatement`, `TemplateLiteral`, `TaggedTemplateExpression`, `AwaitExpression`, computed `MemberExpression`, empty / non-empty `ObjectExpression`, class methods (including async, get / set, static) and object method shorthand, TS generics, type predicates (`x is T` and `asserts x is T`), as-expressions, union / array type annotations, self-closing JSX, element attribute spread, and `JSXExpressionContainer` inside `<tsx>` blocks.
- `<tsx>` / `<>` single-child unwrapping is now JSX-context-aware: `return <tsx>{'x'}</tsx>` compiles to `return 'x';` rather than invalid `return {'x'};`, while `<b><>{111}</></b>` still preserves the inner `{111}` container.
- Class methods no longer crash source-map collection (every function-like node gets `metadata` defaulted).
