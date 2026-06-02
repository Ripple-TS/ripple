---
"@tsrx/core": patch
"@tsrx/prettier-plugin": patch
"@tsrx/ripple": patch
"ripple": patch
---

Parse `=>` as a TSRX render statement and allow return statements inside TSRX template bodies. Ripple now renders return arguments before applying the existing return guard for following siblings, while `=>` yields from the current TSRX block, skips later siblings in that block, and can be used as a component `children` prop shortcut.
