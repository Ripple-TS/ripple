---
'@tsrx/ripple': patch
'ripple': patch
---

fix: merge provably-primitive call-containing expressions into text runs

Adjacent text and expression children previously refused to merge whenever the
expression contained a call, leaving shapes like `<div>label: {String(f())}</div>`
split into a text run plus a separate anchor — which crashed client rendering
(the text anchor coalesced with the preceding template text) and could not
hydrate against the server's inlined output. An expression that provably
evaluates to a text primitive now merges into the run, so both targets render
one shared text node; a provably-string child concatenates bare instead of
being double-wrapped in `String(… ?? '')`. The client runtime's non-hydrating
text-anchor lookup also creates the expected text node when the template text
coalesced, matching its hydrating behavior.
