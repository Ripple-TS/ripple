# Async `track(() => ...)` Implementation Checklist

Reference plan: `async-track-client-plan.md`

- [ ] 1. Update public `track()` types to allow async function returns and export `DERIVED_UPDATED`.
- [ ] 2. Prohibit `await` everywhere inside client components, including `try/pending` bodies.
- [ ] 3. Add async bookkeeping to client derived state for promise versioning, cached values, source block ownership, boundary ownership, and abort support.
- [ ] 4. Upgrade derived evaluation and read semantics so `_$_.get(...)` handles sync values, promises, and `{ promise, abortController }` results.
- [ ] 5. Add nearest-upstream pending-boundary lookup and fail uncached async reads without a parent `try { ... } pending { ... }` boundary.
- [ ] 6. Refactor client `try.js` to manage boundary-scoped async requests, grouped pending reveal, direct catch rendering, and stale request suppression.
- [ ] 7. Preserve stale-while-revalidate behavior when async deriveds already have cached values.
- [ ] 8. Ignore settlements from destroyed source blocks or destroyed boundary blocks.
- [ ] 9. Abort superseded requests with `abortController.abort(DERIVED_UPDATED)` and suppress catch rendering for that control-flow reason.
- [ ] 10. Remove await-only client helpers and wrappers: `maybe_tracked()`, `async_computed()`, and `_$_.async(...)`.
- [ ] 11. Update client tests to cover first-load suspension, cached reads, parent-owned boundaries, grouped pending, rejection routing, stale promises, and aborts.
- [ ] 12. Run targeted validation for client runtime, compiler errors, and affected async tests.
