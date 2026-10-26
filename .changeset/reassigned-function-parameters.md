---
'@tsrx/ripple': patch
---

Preserve typed function parameter declarations when reassigned values are read
from JSX, preventing invalid client JavaScript such as `function render(label.v)`.
