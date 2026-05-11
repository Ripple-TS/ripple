---
'@tsrx/core': patch
'@tsrx/react': patch
'@tsrx/preact': patch
---

Drop the continuation/tail-helper lift for hook-bearing `if`, `switch`, `try`, and `for-of` blocks in React and Preact output. The pattern existed to forward post-hook mutations through to statements after the control-flow construct, but the hook-callback-outer-mutation and hook-result-outer-assignment validations make those mutations unreachable. The hook-bearing branch is still wrapped in its own `StatementBodyHook` helper to satisfy Rules of Hooks; trailing statements now stay in the parent component instead of being lifted into a tail helper. For-of helpers no longer thread an `_tsrx_isLast_*` prop or emit an empty-source fallback. Output is smaller and easier to read with no behavior change for valid programs.
