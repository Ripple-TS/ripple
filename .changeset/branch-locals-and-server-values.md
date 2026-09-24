---
'@tsrx/ripple': patch
---

An `@if` or `@switch` branch can now declare a local with the same name as one
its condition or a sibling branch reads. Before, the client output declared that
name twice and failed to compile. A hoisted condition, branch or render block
also captures an outer local that it reads next to a nested declaration of the
same name, such as a `for (const label of …)` loop. Before, it read an undefined
name at runtime.

On the server, a template value assigned inside an `@if`, `@switch`, `@for` or
`@try` branch, such as `const styles = <style>…</style>` or
`const el = <span />`, now compiles as it does in the component body.
