# SVG dashboard benchmark

A hand-written SVG observability dashboard, ported from Octane `origin/main` at
`de270e3b46310ffa228aea574e89b999b094dfec` (2026-09-16). Ripple, Octane TSRX,
React, Solid, Svelte, and Inferno render the same dashboard without chart
libraries. Dependencies use this repository's benchmark catalog; Octane is the
published 0.2.6 package and Ripple uses workspace source.

## Workload

One 1200×800 SVG document contains a topology map with 150 service nodes and 200
edges, eight charts with five keyed series each, 32 sparklines, 150 dynamic SVG
icons, and portal tooltips in an overlay `<g>`. Node labels use HTML inside
`foreignObject`. Shared data and operations produce every path, transform, label,
class, style, and attribute value; framework code binds those snapshots to DOM.

| Operation            | Work measured                                                        |
| -------------------- | -------------------------------------------------------------------- |
| `mount`              | Dashboard creation, including dynamic icons and foreignObject labels |
| `charts_tick`        | Chart paths, gradient stops, ticks, legends, and sparklines          |
| `tick_sparse`        | Fresh snapshots with unchanged values                                |
| `drag_nodes`         | Node transforms and incident edge paths                              |
| `pan_zoom`           | Viewport and root transform updates                                  |
| `select_toggle`      | SVG class attributes on nodes and edges                              |
| `topology_churn`     | Keyed insertion, movement, and removal inside SVG                    |
| `label_churn`        | SVG-to-HTML namespace transitions during label insertion/removal     |
| `tooltip_swarm`      | Portal tooltip creation, updates, and removal                        |
| `icon_swap`          | Runtime SVG tag changes and `<use href>` updates                     |
| `series_toggle`      | Series insertion/removal, path rescaling, and tick relabeling        |
| `style_spread_pulse` | SVG style objects and spread attribute bags                          |

Each operation retains upstream's fixed batch sizes. Samples include the entire
batch without dividing by the repetition count. Window hooks synchronously flush
framework updates. Before each warmup or measured sample, the harness performs
setup, yields, collects garbage, and reads `document.body?.offsetHeight` before
starting the timer. This starts from a laid-out tree without charging forced
layout to the operation. Application code remains prohibited from reading layout
for positioning.

## Correctness

Before timing, every fixture must pass the shared data/operation file hash check,
a Node-side replay of the same operations, SVG/HTML namespace checks, keyed
survivor identity, and exact DOM parity with the other selected frameworks at
mount and after the operation sequence. The harness verifies path strings,
transforms, classes, icons, styles, spread attributes, tooltip placement, and
series/tick state. Uncaught browser errors fail the run.

DOM census metrics include SVG elements, foreignObject HTML, and definitions.
Comments and text-node bookkeeping are reported but are not required to match.
Octane's private JIT-disabled production-call counter, absolute budgets, and
historical performance claims are not imported.

## Ripple integration

Ripple uses `track`, derived icon props, keyed `@for`, native dynamic tags for the
shared icon tuples, and `Portal` into the SVG overlay. State is separated into
topology, charts, and viewport/UI domains. Dashboard markup stays under an
explicit `<svg>` so namespace context is available to the compiler. Every window
operation uses `flushSync`, and mounting disables the default root boundary as in
the other synchronous benchmarks. The icon's outer `<svg>` carries the shared
`ICON_SVG_ATTRS` values as static markup, as the Svelte and Solid fixtures do, and
its two shape positions are unrolled as in Solid: each is a dynamic tag over the
shared `[tag, attrs]` tuple read from `ICONS[name]`.

The `tsconfig.json` and Vite plugin settings match the existing portal-swarm
Ripple fixture: strict checking, `textTypes`, `rootBoundary: false`, excluded
external Ripple modules, and esbuild production output, plus `ssr: false` for a
client-only build as in the todomvc and signal-favoring fixtures. Only the preview
port changes to 5306. All six copies of `data.js` and `ops.js` are identical;
Inferno's upstream comment-only variation is normalized to the shared copy.

## Run

```sh
pnpm bench --quick svg-dashboard
pnpm bench svg-dashboard
pnpm bench --quick --targets=ripple,react svg-dashboard
```

The unified runner builds and owns its preview processes. For manual inspection:

```sh
pnpm --filter ripple-svg-dashboard-bench build
pnpm --filter ripple-svg-dashboard-bench preview
```

The page mounts only when `window.__mount()` is called. Existing saved benchmarks
remain historical results; this suite has no imported local baseline.
