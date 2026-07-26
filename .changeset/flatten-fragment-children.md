---
'@tsrx/ripple': patch
---

fix: render fragment children inline with zero extra DOM

An authored `<>…</>` in children position previously compiled to a comment
anchor plus a runtime `tsrx_element` expression on the client while the server
inlined its content bare — an extra comment node and render unit per fragment,
and a client/server DOM shape mismatch that broke hydration of fragment
children. Template fragments in children position now flatten during child
normalization: their children render inline in the parent template (text runs
merge across the former fragment boundary), adding no DOM nodes at all.
Code-block chain fragments, generated value wrappers, and component root
render fragments keep their existing lowering; the to_ts view keeps authored
fragments verbatim. `<head>` extraction and value-position classification look
through flattened fragments.
