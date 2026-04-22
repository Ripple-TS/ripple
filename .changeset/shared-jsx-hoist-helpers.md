---
'@tsrx/core': patch
'@tsrx/react': patch
---

Lift the JSX hoist-safety predicates (`isStaticLiteral`, `isHoistSafeExpression`, `isHoistSafeJsxChild`, `isHoistSafeJsxAttribute`, `isHoistSafeJsxNode`) into `@tsrx/core`. `@tsrx/react` and `@tsrx/preact` now share a single implementation, so future targets (and bug fixes) no longer need to duplicate the logic.
