---
'@tsrx/core': patch
---

Fix a parser stack overflow on a text-then-element sibling that follows
newline-separated sibling elements (e.g. `<pre><b>2</b>\n<b>3</b>1<b>4</b></pre>`).
The newline between two siblings leaves a stale `jsxText` token anchored on the
next `<`; recovering from it used to clear *every* JSX children context —
including the parent element's own — so the later `text<tag>` sibling tokenized
its `<` as a relational operator that `parseTemplateBody` has no branch for,
recursing forever. The recovery now keeps one children context per still-open
ancestor when the `<` opens a child/sibling tag, and only clears the full run
when it opens a closing `</tag>`.
