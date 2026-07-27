---
'@tsrx/core': patch
'@tsrx/ripple': patch
---

Replace every `any` in `@tsrx/core` with the real AST, CSS, parser and runtime types, move all remaining `@typedef` blocks into the package's `types/` declarations, and typecheck `packages/tsrx/tests` alongside `src` and `types`.

Public type declarations gained accuracy along the way: `TSModuleDeclaration.id` accepts a string literal, `TSModuleBlock.body` allows imports and exports, `AnalysisResult` declares its `module` field, `ImportDeclaration`/`ImportExpression` declare their legacy `assertions`/`arguments` slots, `Program` declares `tsrx_keyword_tokens`, and `zimmerframe`'s `walk` plus esrap's `print`/`tsx` are generic over their state instead of `any`. New builders (`ts_qualified_name`, `ts_import_equals`, `assignment_prop`) and shared helpers (`node_children`, `is_style_element`) replace hand-built nodes and duplicated predicates.

The published runtime declarations keep their reach: `normalize_spread_props`, `normalize_spread_props_for_ref_attr` and `exclude_prop_from_object` accept any object — an interface- or class-typed props bag included — rather than only an index-signature type, and `exclude_prop_from_object` now returns `Omit<T, K>` so the surviving props stay readable. `create_ref_prop` and `apply_ref_value` now resolve their node type through a `RefTarget` overload that mirrors the runtime's own resolution order, so a ref to an element carrying a `value` property (`input`, `button`, `select`, `textarea`, `option`, `li`, `progress`, `meter`, `output`, `data`) resolves to the element instead of to `string`. Type-level tests pin the inferred types of every published ref and language helper, so a signature change that degrades editor completion fails a test.
