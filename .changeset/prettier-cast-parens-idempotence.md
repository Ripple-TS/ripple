---
"@tsrx/prettier-plugin": patch
---

Keep required parentheses around low-precedence `as`/`satisfies` operands (`(a ?? b) as string` no longer loses its cast grouping), print the definite-assignment assertion on variable declarations (`let x!: T`), and make formatting single-pass idempotent: wrap return/throw arguments that carry own-line leading comments in parentheses instead of letting ASI detach them, decide arrow-body and array-element breaking from the printed doc rather than the original source span, and keep simple `as`-cast text holes inline in JSX. The test suite now formats every case twice and asserts byte-equal output.
