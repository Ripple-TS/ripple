# News SSR + hydration benchmark

A large "news site" document (header + a `@for` feed of article cards, lorem
ipsum) that measures, per target (**ripple-new** and **Solid 2.0**):

- **SSR render time** — `renderApp()` → HTML string, in Node, warm.
- **Hydration time** — hydrating the app in a headless browser, on a fresh page
  whose `#app` already holds the server-rendered DOM (timed in isolation via a
  deferred `window.__hydrate()`).

It also asserts **correctness**: that hydration _adopts_ the server DOM with no
rebuild (`#app.innerHTML` unchanged) and that the page is interactive afterward
(the header theme toggle flips).

Both apps are authored in the SAME `.tsrx` source shape and render the same
dataset, so the comparison is pure framework cost: ripple-new compiles via
`@tsrx/ripple-new` (single runtime, `render()` + `hydrate()`); Solid compiles via
`@tsrx/solid` + `vite-plugin-solid` to Solid 2.0 (`@solidjs/web` `renderToString`
+ `hydrate`, a hydratable two-build that Vite's middleware mode drives per-request).

This bench exercises ripple-new's cursor-based hydration of **control flow +
nested components** (the `@for` feed adopts each item's `<!--[-->…<!--]-->` range;
the `Header` component adopts its own range) — i.e. it only works because
hydration was extended beyond single leaf templates.

## Run

```bash
pnpm install
node benchmarks/news/gen.mjs 50          # regenerate the dataset into every target (default 50)
node benchmarks/news/run.mjs ripple-new  # ripple-new (default; `run.mjs 20` also works)
node benchmarks/news/run.mjs solid 20    # Solid 2.0, 20 iterations (+5 warmup)
```

`run.mjs [target] [iterations]` — `target` ∈ `{ripple-new, solid}` (default
`ripple-new`; a bare number is treated as iterations for back-compat).

## Layout

| File                             | Role                                                                                  |
| -------------------------------- | ------------------------------------------------------------------------------------- |
| `gen.mjs`                        | Generates `<target>/src/data.js` for every target (deterministic lorem-ipsum).        |
| `<target>/src/App.tsrx`          | Header component + `@for` feed of article cards + footer.                             |
| `<target>/src/Header.tsrx`       | A stateful component (ripple-new `useState` / Solid `createSignal`) with a theme toggle. |
| `<target>/src/entry-server.ts`   | `renderApp()` → `{ head, body, css }`.                                                |
| `<target>/src/entry-client.ts`   | Deferred `window.__hydrate()`.                                                        |
| `run.mjs`                        | Vite middleware server + Playwright; measures SSR + hydration; prints median/min/p95. |

## Solid 2.0 toolchain note

`vite-plugin-solid@3.0.0-next.5` transitively resolves `babel-preset-solid@2.0.0-beta.7`
(→ `babel-plugin-jsx-dom-expressions` 0.41, which still **emits** the `ssrRunInScope`
SSR helper), but `@solidjs/web@2.0.0-beta.14` **removed** that export (dom-expressions
0.50 stopped emitting it). Without alignment, Solid SSR throws _"does not provide an
export named 'ssrRunInScope'"_. A pnpm override in `pnpm-workspace.yaml` forces the
0.50-era preset the catalog already intends (`babel-preset-solid: 2.0.0-beta.14`), so
the SSR transform matches the installed runtime. Run `pnpm install` after pulling to
apply it.

The Solid feed uses a plain (non-keyed) `@for`: Solid's keyed `<For>` passes each
item as an accessor (`a().title`), the default passes it directly (`a.title`).
Keying only affects update reconciliation, which this render-once + hydrate bench
never exercises.

## Follow-ups

- **React target**: the harness is multi-target (it isolates SSR-render vs
  hydration timing and resolves the app dir + port by target name); a React app
  (`renderToString` + `hydrateRoot`) can be added under `benchmarks/news/react`
  and driven the same way (add its port to `TARGET_PORTS` in `run.mjs`).
- **`@if`/`@switch` hydration (ripple-new)**: not yet wired (the bench uses `@for`
  + components, which are). Hookless ("lite") nested components also don't hydrate
  yet — give a hydrated component a hook so it uses the full slot.
