---
'@tsrx/core': patch
---

Fixed the tokenizer reading `/` and `#` as literal template-text characters in JS positions nested under a template element: division in a nested element's attribute expression (`<g><rect x={a - b / 2} /></g>`), division and private-field access in child expression containers (`{a / 2}`, `{this.#x}`), and division in control-flow directive headers (`@if (a / 2 > 1)`) all mis-parsed as "Unexpected token". The text special-case now skips expression containers and directive headers, where acorn's own tokenizer handles division vs regex correctly; literal `/` and `#` in template text are unchanged.
