# ripple-new

Template-clone renderer with a React-shape state model — the successor renderer
for the ripple ecosystem. Components are authored in `.tsrx` and compiled by
[`@tsrx/ripple-new`](../tsrx-ripple-new) to calls into this runtime.

It implements the React-shape surface: hooks (`useState`, `useReducer`,
`useEffect`/`useLayoutEffect`/`useInsertionEffect`, `useMemo`, `useCallback`,
`useRef`, `useId`, `useTransition`, `useDeferredValue`, `useSyncExternalStore`,
`useImperativeHandle`, `useEffectEvent`), `use(thenable)` suspense via
`@try`/`@pending`/`@catch`, transitions, portals, context, and fragment refs, over
a keyed template-clone reconciler.

## Scope & non-goals

ripple-new is **client-only** today. There is intentionally **no SSR or hydration
pipeline**:

- `useSyncExternalStore` accepts a `getServerSnapshot` argument for API
  compatibility but ignores it — `getSnapshot()` is always used.
- The runtime requires a live DOM: `template()` builds nodes with
  `document.createElement`, and control-flow / portal / component slots use
  `document.createComment` markers. There is no string-rendering path.

If you need server rendering, use the `ripple` runtime, not `ripple-new`.

## Status

Experimental / pre-release (`private`, `0.0.x`). The API shape tracks React but
some surface area and edge cases are still being filled in; see `audit/` for the
conformance audits and `audit/SUSPENSE_DIVERGENCE.md` for the catalogue of
intentional divergences from React.
