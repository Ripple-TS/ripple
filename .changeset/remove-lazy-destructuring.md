---
'ripple': minor
'@tsrx/ripple': minor
---

Lazy destructuring is removed from the language (tsrx RFC #106). `&[ ... ]` and `&{ ... }` are syntax errors now; a tracked value is read and written through `.value`, and a `Tracked`, `Derived`, or `WritableDerived` object is passed to a child as it is (`<Child {count} />`, or `count={track(() => count.value)}` for a read-only view).

| Before | After |
| --- | --- |
| `let &[count] = track(0); count++; {count}` | `const count = track(0); count.value++; {count.value}` |
| `let &[count, countT] = track(0); <Child count={countT} />` | `const count = track(0); <Child {count} />` |
| `let &[double] = track(() => count * 2)` | `const double = track(() => count.value * 2)` |
| `function Card({ count: &[count] }: { count: Tracked<number> })` | `function Card({ count }: { count: Tracked<number> })` and `count.value` |

`Tracked<V>`, `Derived<V>`, and `WritableDerived<V>` are plain `{ value: V }` shapes; the `[V, Tracked<V>]` tuple member, the runtime `[0]`/`[1]` accessors, and the `lazy_array_*` helpers are gone, and `count[0]` reports the ordinary "use `.value`" error. The compiler owns `extract_paths` (rest and default lowering for `@for` patterns and destructuring assignments). On the server a dynamic tag `<{tag} />` is lowered to `_$_.dynamic_element(tag, props)`, with the tag and the element's own props passed separately, so the props never carry an `is` entry.
