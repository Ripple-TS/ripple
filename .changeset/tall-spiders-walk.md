---
'@ripple-ts/typescript-plugin': minor
'@ripple-ts/language-server': minor
'@ripple-ts/prettier-plugin': minor
'@ripple-ts/eslint-parser': minor
'@ripple-ts/eslint-plugin': minor
'@ripple-ts/vscode-plugin': minor
'@ripple-ts/compat-react': minor
'ripple': minor
'ripple-website': minor
---

Introduces #ripple namespace for creating ripple reactive entities without
imports, such as array, object, map, set, date, url, urlSearchParams, mediaQuery.
Adds track, untrack, trackSplit, effect, context, server, style to the namespace.
Deprecates #[] and #{} in favor of #ripple[] and #ripple{}. Renames types and
actual reactive imports for TrackedX entities, such as TrackedArray,
TrackedObject, etc. into RippleArray, RippleObjec, etc.
