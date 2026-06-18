# News SSR + hydration benchmark

A large "news site" document (header + a `@for` feed of article cards, lorem
ipsum) that measures, per target (**ripple-new**, **ripple**, **Solid 2.0**,
**React 19**):

- **SSR render time** — the built `renderApp()` → HTML string, in Node, warm.
- **Hydration time** — the SYNCHRONOUS hydration work in a headless browser, on a
  fresh page whose `#app` already holds the server-rendered DOM (timed in
  isolation via a deferred `window.__hydrate()`), with the production client
  bundle loaded. All targets commit hydration synchronously inside `__hydrate()` —
  ripple-new and React via `flushSync`, Solid is synchronous — so this is the
  hydration _work_, not frame-scheduling latency. (React's `hydrateRoot` is
  concurrent and would otherwise defer the work out of the measured window,
  reading as near-zero; `flushSync` forces it to commit so the comparison is
  apples-to-apples. Measuring "total work" is fair vs the others' synchronous
  hydrate; React's scheduler would spread that work non-blocking in production.)

**Production only.** The harness `vite build`s each target (client minified + an
SSR bundle, `NODE_ENV=production`) and measures the BUILT artifacts — never dev.
Dev numbers are misleading: unminified code plus the frameworks' _development_
runtimes (React/Solid dev builds carry warning + validation overhead; ripple-new
dev transforms aren't optimized). The difference is large — e.g. React's
`renderToString` measured ~2 ms in dev vs ~0.1–0.3 ms in production.

It also asserts **correctness**: that hydration _adopts_ the server DOM with no
rebuild (`#app.innerHTML` unchanged) and that the page is interactive afterward
(the header theme toggle flips).

All apps are authored in the SAME `.tsrx` source shape and render the same
dataset, so the comparison is pure framework cost:

- **ripple-new** — `@tsrx/ripple-new` (single runtime, `render()` + `hydrate()`).
- **ripple** (original) — `@tsrx/ripple` + `ripple` (`ripple/server` `render()` →
  `{ head, body, css }` + `ripple` `hydrate()`). State via `track`. There's no
  transform-only Ripple vite plugin (the published one is the metaframework), so
  the bench's `vite.config.js` carries a tiny inline `.tsrx`→Ripple transform.
- **Solid 2.0** — `@tsrx/solid` + `vite-plugin-solid` (`@solidjs/web`
  `renderToString` + `hydrate`, a hydratable two-build Vite drives per-request).
- **React 19** — `@tsrx/react` (`react-dom/server` `renderToString` +
  `react-dom/client` `hydrateRoot`; one JSX transform serves both, no two-build).

Reactive state is authored per target (the one real authoring difference):
ripple-new/React `useState`, Solid `createSignal`, original Ripple `track`.

This bench exercises ripple-new's cursor-based hydration of **control flow +
nested components** (the `@for` feed adopts each item's `<!--[-->…<!--]-->` range;
the `Header` component adopts its own range) — i.e. it only works because
hydration was extended beyond single leaf templates.

## Run

```bash
pnpm install
node benchmarks/news/gen.mjs 50          # regenerate the dataset into every target (default 50)
node benchmarks/news/run.mjs ripple-new  # builds (prod) + benches; `run.mjs 20` also works
node benchmarks/news/run.mjs ripple 20   # original Ripple, 20 iterations (+5 warmup)
node benchmarks/news/run.mjs solid 20    # Solid 2.0
node benchmarks/news/run.mjs react 20    # React 19
node benchmarks/news/run.mjs react 20 --no-build   # reuse the existing dist/ (skip rebuild)
```

`run.mjs [target] [iterations] [--no-build]` — `target` ∈
`{ripple-new, ripple, solid, react}` (default `ripple-new`; a bare number is
treated as iterations for back-compat). Each run rebuilds the target's production
client + SSR bundles unless `--no-build` is passed. Build output goes to
`<target>/dist/` (git-ignored).

## Layout

| File                           | Role                                                                                                                                 |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| `gen.mjs`                      | Generates `<target>/src/data.js` for every target (deterministic lorem-ipsum).                                                       |
| `<target>/src/App.tsrx`        | Header component + `@for` feed of article cards + footer.                                                                            |
| `<target>/src/Header.tsrx`     | A stateful component (ripple-new/React `useState`, Solid `createSignal`, Ripple `track`) with a theme toggle.                        |
| `<target>/src/entry-server.ts` | `renderApp()` → `{ head, body, css }`.                                                                                               |
| `<target>/src/entry-client.ts` | Deferred `window.__hydrate()`.                                                                                                       |
| `run.mjs`                      | `vite build` (client + SSR, prod) → static-serves the built artifacts + Playwright; measures SSR + hydration; prints median/min/p95. |

## Solid 2.0 toolchain note

`vite-plugin-solid@3.0.0-next.5` transitively resolves
`babel-preset-solid@2.0.0-beta.7` (→ `babel-plugin-jsx-dom-expressions` 0.41,
which still **emits** the `ssrRunInScope` SSR helper), but
`@solidjs/web@2.0.0-beta.14` **removed** that export (dom-expressions 0.50 stopped
emitting it). Without alignment, Solid SSR throws _"does not provide an export
named 'ssrRunInScope'"_. A pnpm override in `pnpm-workspace.yaml` forces the
0.50-era preset the catalog already intends (`babel-preset-solid: 2.0.0-beta.14`),
so the SSR transform matches the installed runtime. Run `pnpm install` after
pulling to apply it.

The Solid feed uses a plain (non-keyed) `@for`: Solid's keyed `<For>` passes each
item as an accessor (`a().title`), the default passes it directly (`a.title`).
Keying only affects update reconciliation, which this render-once + hydrate bench
never exercises. The React feed keeps the keyed `@for` (→
`.map(a => …key={a.id})`), which passes each item by value, so `a.title` is
direct.

## React note

React's components use `className` (not `class`): `@tsrx/react` only rewrites
`class` → `className` while injecting a CSS-scope hash, which these style-free
bench components skip. `className` renders to the same `class` DOM attribute, so
the document is identical to the other targets — it just avoids React's dev-mode
_"Invalid DOM property `class`"_ warning. State uses React's own `useState`
(ripple-new's is React-shaped, so the authoring is otherwise identical).

## Follow-ups

- **`@if`/`@switch` hydration (ripple-new)**: not yet wired (the bench uses `@for`
  - components, which are). Hookless ("lite") nested components also don't hydrate
    yet — give a hydrated component a hook so it uses the full slot.
