---
'ripple': patch
'@ripple-ts/compat-react': patch
'@ripple-ts/prettier-plugin': patch
'@ripple-ts/language-server': patch
'@ripple-ts/vscode-plugin': patch
---

Add a release changeset for the async tracking work introduced in commit
`4eb4d6851573d771d65f1e85b1b442ad3cdc53d2`, including `trackAsync`/`trackPending`
runtime and compiler updates, compat-react async boundary behavior, and related
editor tooling updates.
