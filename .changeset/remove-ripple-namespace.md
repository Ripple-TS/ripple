---
'ripple': minor
---

Remove `#ripple` namespace syntax in favor of direct imports from `'ripple'`

The `#ripple` namespace (`#ripple.track()`, `#ripple.effect()`, `#ripple.array()`, etc.) has been removed. All reactive APIs are now accessed via standard imports:

```ripple
import { track, effect, untrack, Context, RippleArray, RippleObject } from 'ripple';
```

- `#ripple.track(value)` → `track(value)`
- `#ripple.effect(fn)` → `effect(fn)`
- `#ripple.untrack(fn)` → `untrack(fn)`
- `#ripple.context(value)` → `new Context(value)`
- `#ripple[1, 2, 3]` → `new RippleArray(1, 2, 3)`
- `#ripple{ key: value }` → `new RippleObject({ key: value })`
- `#ripple.style` → `#style`
- `#ripple.server` → `#server`
