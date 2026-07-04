---
'@tsrx/prettier-plugin': patch
---

Respect `// prettier-ignore` (and `/* prettier-ignore */`) directives. A node
immediately preceded by a `prettier-ignore` comment is now emitted verbatim from
the original source instead of being reformatted, matching Prettier core
behavior. This works for statements, JSX elements, and fragments.
