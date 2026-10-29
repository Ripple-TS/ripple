# ViewTransition contract and conformance

This is the coverage inventory for issue #1581. Public behavior and examples are
in `website/docs/guide/view-transitions.md`; declarations are in
`packages/ripple/types/index.d.ts`. All tests here are independently authored. No
React implementation or upstream test source is copied or adapted.

## Pinned references

- React **19.3.0**, tag commit
  [`1d34f91dfde6bba84d08b683aaba164c7194dacb`](https://github.com/facebook/react/tree/1d34f91dfde6bba84d08b683aaba164c7194dacb).
  `reference/package.json` and its separate lockfile pin the executable example.
- [ViewTransition documentation](https://github.com/reactjs/react.dev/blob/0821e7d9428a6c58c922765b891bbffba9ed6249/src/content/reference/react/ViewTransition.md),
  documentation commit `0821e7d9428a6c58c922765b891bbffba9ed6249`.
- [ReactDOMViewTransition tests](https://github.com/facebook/react/blob/1d34f91dfde6bba84d08b683aaba164c7194dacb/packages/react-dom/src/__tests__/ReactDOMViewTransition-test.js):
  enter, exit, update, paired names, Suspense resolution, and nested enter/exit
  examples informed the behavioral inventory. React is MIT licensed, copyright
  Meta Platforms, Inc. and affiliates; its installed packages retain their
  LICENSE. Only documented component props are part of this contract; gated
  upstream experiments are not listed as missing public API.
- [CSS View Transitions Level 1](https://www.w3.org/TR/css-view-transitions-1/),
  same-document callback API and lifecycle promises; Level 2
  [2024-11-13 Working Draft](https://www.w3.org/TR/2024/WD-css-view-transitions-2-20241113/)
  for transition types, class selectors, and same-origin cross-document
  navigation. Named SSR roots participate before hydration; component callbacks
  remain tied to same-document commits.
- TanStack router core's native wrapper is the installed `@tanstack/router-core`
  version in the workspace lockfile. The adapter replaces that wrapper only when
  given a Ripple controller.

The pinned executable React reference invokes `onShare` only on the outgoing
boundary. Ripple follows that observed behavior, even though documentation about
shared activation describes both sides. The browser comparison asserts the
callback sequence rather than inferring it from the component signature.

## Behavior matrix

`client` below means `../client/view-transition.test.tsrx`; `browser` means
`../browser/view-transition.js`. Compiler cases are in
`packages/tsrx-ripple/tests/view-transition.test.js`.

| Behavior                | Ripple contract / intentional difference                                                                                                    | Evidence                                              |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| Activation              | Explicit state updates plus automatic wrapped pending reveals; mount/hydration do not activate                                              | client; browser; reference                            |
| Enter/exit              | First boundary of an inserted/removed subtree, no new/removed DOM ancestor                                                                  | client; browser; reference                            |
| Nested update           | Nearest owned boundary receives DOM mutations; geometry changes also activate                                                               | client; browser reorder                               |
| Shared pair             | Same explicit name, unrelated branches, both onscreen; share before enter/exit; outgoing callback only                                      | client; browser; reference                            |
| Names                   | Document-wide auto uniqueness, CSS identifier subset, duplicate/invalid development diagnostics                                             | client; hydration                                     |
| Rootless/multiple roots | No wrapper/marker; element roots get ordered suffixes; text alone is excluded                                                               | client; SSR equality; 500-boundary browser comparison |
| Styles                  | All five props support auto/none, type maps and live values; scope tokens preserve browser defaults and none precedence                     | client; browser                                       |
| Scoped CSS              | Local argument filters, global escapes, portable style maps, nested/applied scopes, and independent keyframe scoping                        | compiler; browser production CSS                      |
| Async                   | Explicit runs wait for visible work; wrapped pending-to-content changes automatically start or join a transition                            | client; streaming hydration                           |
| Ordering                | Old snapshot, update, render/effect/ref completion, assets, new snapshot, callbacks, cleanup                                                | deterministic native fixture; browser promises        |
| Rapid changes           | One owner/document; supersede prior work; stale unstarted updater never commits                                                             | client; browser interruption                          |
| Flush/skip/errors       | Writes are not rolled back; skip still updates; failures release resources and reject handles                                               | client; browser                                       |
| Readiness               | Relevant images/fonts bounded by total timeout; caller awaits stylesheets in async updater                                                  | client assets/timeout; documented exclusions          |
| Callback instance       | Four pseudo targets; animate/getAnimations return arrays for multiple roots                                                                 | type cases; client; real WAAPI browser                |
| Callback lifetime       | Once on finish/interruption/live owner removal; outgoing owner retained only for animation                                                  | client; browser repeated runs                         |
| Activity                | Both nesting orders retain nodes/state; deferred visibility activation can enter; initial adoption is unanimated                            | client; existing render-observer suites               |
| SSR                     | No wrappers/markers; explicit names/shared classes emitted for navigation; anonymous output unchanged                                       | server; hydration                                     |
| Hydration               | No initial animations or duplicate naming; preserve nodes/input edits; chunks before/after hydrate; pending updates                         | hydration; browser                                    |
| Partial APIs            | No native API, reduced motion, native types absent, synchronous native failure                                                              | client; three browser engines                         |
| Accessibility           | Automatic reduced-motion opt-out; surviving focus/input/keyboard behavior preserved                                                         | client; browser                                       |
| Router interop          | Optional controller replaces TanStack's native wrapper; respects false/types and restores on unmount                                        | adapter client test                                   |
| Reference comparison    | Activation, event order, node identity, final UI for update/share/exit/enter and automatic pending reveal                                   | isolated React/Ripple browser comparison              |
| Runtime cost            | Zero DOM/SSR-byte increase for 500 unnamed boundaries; feature excluded when unused; raw/gzip delta; repeated callbacks/nodes/Chromium heap | browser report                                        |

| Cross-document | Explicit names + shared CSS, SSR before hydration, outgoing
refresh and history restoration; browser fallback where unsupported | native
Chromium/WebKit navigation; Firefox fallback; SSR/client tests |

## Validation

```sh
pnpm test --project ripple-client --project ripple-server --project ripple-hydration --project tsrx-ripple view-transition
pnpm test --project tanstack-router-client packages/tanstack-router/tests/client/component-view-transition.test.tsrx
pnpm typecheck
pnpm --dir packages/ripple/tests/view-transition/reference install --ignore-workspace --ignore-scripts --frozen-lockfile
pnpm --filter ripple exec node tests/browser/view-transition.js
```

The separate reference install keeps React out of Ripple's runtime dependencies
and normal workspace install. Browser tests require Playwright's Chromium,
Firefox, and WebKit binaries. All three must run; the runner does not silently
skip an absent browser. Mocks establish ordering, not visual correctness.

The native suite verifies actual pseudo-element animations and class-selected CSS
durations, production CSS loading, WAAPI cancellation, focus/keyboard/input
retention, unsupported/reduced-motion paths, and style cleanup. It records the
browser versions and feature probes. `VIEW_TRANSITION_TRACE` selects its JSON
report path (default: the system temporary directory's
`ripple-view-transition-trace.json`). Timings/heap differences are descriptive,
not fixed performance thresholds. Chromium heap and DOM counters are measured
after forced GC around repeated transitions. Callback and DOM-node lifetime
invariants are asserted in every engine. Five hydration samples each compare 500
plain elements and 500 boundaries with identical SSR markup and DOM-node counts.

The matrix defines the supported behavior. Cross-document component callbacks and
React concurrent scheduling are not implied by the shared styling surface.

An example local run is recorded in [measurements.json](./measurements.json). It
includes raw/gzip bundle deltas, five-sample hydration medians, callback/DOM
lifetime counts, Chromium heap counters, browser versions, and the scenarios
compared against React. Rerun the script to measure another machine or revision.

Scoped styling checks also compare `auto` against an unstyled native browser
transition, verify two components can reuse a class label with different
animations, exercise an explicit global recipe and a local wildcard override, and
confirm that `none` remains disabled. Incoming cross-document snapshots exercise
scoped SSR CSS before hydration.

Bugbot review regressions cover updater errors with queued automatic reveals and
missing `matchMedia`/`defaultView`. The former required a fix; the latter already
short-circuited correctly through optional chaining.
