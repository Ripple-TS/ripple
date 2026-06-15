# News SSR + hydration benchmark

A large "news site" document (header + a `@for` feed of article cards, lorem
ipsum) that measures, for **ripple-new**:

- **SSR render time** — `render(App)` → HTML string, in Node, warm.
- **Hydration time** — `hydrate(App, #app)` in a headless browser, on a fresh page
  whose `#app` already holds the server-rendered DOM (timed in isolation via a
  deferred `window.__hydrate()`).

It also asserts **correctness**: that hydration _adopts_ the server DOM with no
rebuild (`#app.innerHTML` unchanged) and that the page is interactive afterward
(the header theme toggle flips).

This bench exercises ripple-new's cursor-based hydration of **control flow +
nested components** (the `@for` feed adopts each item's `<!--[-->…<!--]-->` range;
the `Header` component adopts its own range) — i.e. it only works because
hydration was extended beyond single leaf templates.

## Run

```bash
pnpm install
node benchmarks/news/gen.mjs 50     # regenerate the dataset (default 50 articles)
node benchmarks/news/run.mjs 20     # 20 iterations (+5 warmup)
```

## Layout

| File                             | Role                                                                                  |
| -------------------------------- | ------------------------------------------------------------------------------------- |
| `gen.mjs`                        | Generates `ripple-new/src/data.js` (deterministic lorem-ipsum articles).              |
| `ripple-new/src/App.tsrx`        | Header component + `@for` feed of article cards + footer.                             |
| `ripple-new/src/Header.tsrx`     | A full component (has a hook) with a theme toggle.                                    |
| `ripple-new/src/entry-server.ts` | `renderApp()` → `{ head, body, css }`.                                                |
| `ripple-new/src/entry-client.ts` | Deferred `window.__hydrate()`.                                                        |
| `run.mjs`                        | Vite middleware server + Playwright; measures SSR + hydration; prints median/min/p95. |

## Follow-ups

- **React / Solid targets**: the harness is structured for multiple targets (it
  already isolates SSR-render vs hydration timing); React (`renderToString`
  - `hydrateRoot`) and Solid (two-build `renderToString` + `hydrate`) apps can be
    added under `benchmarks/news/{react,solid}` and driven the same way.
- **`@if`/`@switch` hydration**: not yet wired (the bench uses `@for` +
  components, which are). Hookless ("lite") nested components also don't hydrate
  yet — give a hydrated component a hook so it uses the full slot.
