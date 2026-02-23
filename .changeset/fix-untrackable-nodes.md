---
'ripple': patch
---

Fix compiler analysis incorrectly marking untrackable nodes as tracked. `MemberExpression` now only enables tracking when the member or its property is actually marked as `tracked`, and unconditional tracking side-effects were removed from `CallExpression` and `NewExpression` visitors.

Also fixes the client transform for `TrackedExpression` in TypeScript mode to emit a `['#v']` member access (marked as `tracked`) instead of the runtime `_$_.get(...)` call, aligning TSX output with tracked-access semantics.
