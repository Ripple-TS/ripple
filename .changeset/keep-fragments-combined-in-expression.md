---
'@tsrx/core': patch
'@tsrx/ripple': patch
---

Keep a `<> … </>` fragment that is combined into an expression as a fragment,
instead of collapsing its single child to a bare value (React, Preact, Solid,
Vue, and Ripple `to_ts`).

A fragment is always a truthy element, but its single child may be falsy, so
unwrapping `<>{0}</>` to `0` flipped the meaning of `<>{0}</> || 'default'` from
rendering `0` to rendering `'default'`. When a fragment is the operand of an
operator, a conditional branch, an array element, or another combined expression,
the fragment is now preserved. The existing collapse is unchanged for a fragment
that is the sole value of a render-output slot (a `return`, a variable
initializer, an arrow body, a call argument), where it only renders and the
collapse is invisible.
