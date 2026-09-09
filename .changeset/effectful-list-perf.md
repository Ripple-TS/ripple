---
'ripple': patch
'@tsrx/ripple': patch
---

Cheaper element refs, effects, and component templates on the client. A `ref` is one effect block keyed on its state instead of a render block that re-evaluates the thunk and creates a branch and an effect for it, since the ref value is read untracked and fixed for the life of the enclosing block. Effects deferred until a component has rendered are recorded as flat entries, and an effect's first run skips the child and teardown sweep. A tracked value written during a flush keeps its previous value for teardowns on itself instead of in a map, and `flushSync` releases those values when it finishes (they were only released by the microtask flush before).

The compiler types the bindings of a lazily destructured pattern (`&{ item }: { item: Item }` as component props, or `const &{ item } = props` from a typed initializer), so their property reads lower to direct text and attribute writes. A component whose body has setup statements beside a single root element clones that element instead of a fragment.
