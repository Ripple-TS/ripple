---
'@tsrx/prettier-plugin': patch
---

Break long type parameter lists one per line with a trailing comma, like vanilla prettier, instead of emitting one overlong line. The `<T,>` trailing-comma preservation now only applies to single-param arrow function generics, where the comma is syntactically meaningful. Function signatures group parameters with the return type so the fitter prefers breaking the parameter list, and type reference arguments can now break too, hugging a single object-type argument.
