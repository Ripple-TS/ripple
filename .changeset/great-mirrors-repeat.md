---
'@tsrx/prettier-plugin': patch
---

fix(prettier-plugin): keep author parens on same-precedence, same-operator right operands — `a - (b - c)`, `a / (b / c)`, and `'x' + (n + 1)` no longer reformat to a regrouped (semantics-changing) chain; `(a ** b) ** c` keeps its left-operand parens since `**` is right-associative
