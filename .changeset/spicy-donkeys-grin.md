---
'@tsrx/prettier-plugin': patch
---

Keep JSX children glued across a whitespace-free text boundary, matching vanilla Prettier. `{state.owner}/{state.repoName}` and `{a}some text{b}` now stay on one line instead of each child being split onto its own line, while whitespace-separated siblings and directly adjacent expressions or elements (`{a} / {b}`, `{a}{b}`, `</p><p>`) still get their own lines.
