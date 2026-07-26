---
'@tsrx/ripple': patch
---

fix: merge provably-primitive call-containing expressions into text runs

Adjacent text and expression children previously refused to merge whenever the
expression contained a call, leaving shapes like `<div>label: {String(f())}</div>`
split into a text run plus a separate anchor — which crashed client rendering
(the text anchor coalesced with the preceding template text) and could not
hydrate against the server's inlined output. An expression that provably
evaluates to a text primitive now merges into the run, so both targets render
one shared text node. Merged operands are nullish-guarded (`String(v ?? '')`)
so nullish values contribute nothing, except provably-string operands and
non-nullish primitive literals, which concatenate bare.
