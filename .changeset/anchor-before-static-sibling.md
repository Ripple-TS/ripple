---
'@tsrx/ripple': patch
'ripple': patch
---

perf: a static component, template `@if`, or template `@for` followed by a static element sibling inserts before that element instead of before a `<!>` placeholder of its own: the element is part of the template and never moves, so the compiled template holds no comment node for it and the client reuses the element's variable where hydration steps to the sibling. The `RippleArray` statics (`from`, `of`, `fromAsync`) lower to standalone runtime functions, so a bundle that never constructs a `RippleArray` drops the array proxy instead of keeping it through property assignments on the constructor's compiled form (the server's `fromAsync` lowering previously named a function that did not exist).
