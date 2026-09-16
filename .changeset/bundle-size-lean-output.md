---
'@tsrx/ripple': patch
'ripple': patch
---

perf: smaller production bundles without a runtime cost. The compiler lowers a static `onBlur`-style handler (an event its name keeps off delegation) to a direct `listen` call with the DOM name and phase resolved at compile time, packs the locals a hoisted `@if`/`@switch` captures under positional keys, writes template strings without attribute quotes or implied end tags where the parser reads them back the same, gives a plain function no `_$_.scope()` call when its body never reads the block, and omits `set_class`'s default trailing arguments. The runtime keeps its hydration paths (template adoption, expression text, append cursor, streamed boundaries) in a module `hydrate()` installs and its `trackAsync` machinery in a module that registers with the runtime on first use, so a client-only mount without `trackAsync` ships neither; the try boundary state, the root event ref and the template cache use short keys, the keyed and reference list diffs share one patch helper, and symbol constants carry no descriptions.
