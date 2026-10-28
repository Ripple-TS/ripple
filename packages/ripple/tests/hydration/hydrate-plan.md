# Hydrate implementation coverage

Audit of [issue #1607](https://github.com/Ripple-TS/ripple/issues/1607). The
[public guide](../../../../website/docs/guide/hydrate.md) contains the
compatibility matrix pinned to TanStack Router
`da2adec76dbe6c0da6d6a0d5640f7b9388217f45`. The checklist follows every task in
the issue, including all delivery milestones.

## 1. Public contract and compatibility matrix

- [x] Component, mandatory `when`, synchronous factory, options, strategies, event
      types, helper export: `types/index.d.ts`, `types/hydration.d.ts`,
      `package.json`; `tests/types/hydrate.ts`.
- [x] Pinned parity matrix, defaults, SSR/client-only, nesting, early updates,
      browser fallbacks: public guide; `hydrate-strategies.test.js`, client/server
      `hydrate.test.tsrx`.
- [x] Replace changed subscriptions, retain equivalent factories, latch
      completion: strategy-key/revision handling in `hydrate-boundary.js`;
      observer replacement, canceled queued conditions, and once-only tests.
- [x] Reactive getters versus boolean snapshots and disposal:
      `hydrate-boundary.js`; condition dependency/disposal tests.
- [x] Completion timing, owning catch propagation, and
      fragment/empty/text/SVG/table ranges: public guide; shape, error, and
      completion tests in `hydrate.test.js` and `hydrate-integration.test.js`.

## 2. Shared deferred hydration foundation

- [x] Reuse Activity's range, owner, context, state machine, cancellation and
      background scheduler: existing `deferred.js`; optional intent registration
      also promotes unresolved Activity ancestors.
- [x] Enough SSR metadata for skipping/targets/nested intent without child setup:
      `[h…` metadata reuses the expression comment pair. Retained conditional
      identities reuse their existing comments. No added wrappers or placeholders.
- [x] Retain owner/context/namespace/root/async/transport beyond root cleanup:
      shared deferred context; SVG shape, multi-root async, changed serialized
      dependency, and captured transport tests.
- [x] Restore cursor/context on success and failure; retain sibling and root
      isolation: shared `hydrate_boundary`; factory setup outside the adoption
      cursor; local recovery, errors, and two-root tests.
- [x] Streaming, pending/catch, async derived hydration, range ownership and local
      mismatch recovery: integration tests for stream arrival before/after
      opening, errors, async updates, removal, and conditional recovery.
- [x] Early reconciliation rules and current props/context/store/branches/input
      edits: directly tracked `children` replacement opens early except `never`;
      computed children and unevaluated nested stores reconcile on activation.
      Documented Ripple adaptation, tested with current context, edited input
      siblings, same-tag branches, and empty branches.

## 3. Strategy adapters

- [x] Seven small SSR-safe typed helpers: `runtime/hydration.js`; shared boundary
      operation and `hydration-strategies.js`.
- [x] Idle default timeout, idle API and exact timer fallback: table-driven
      strategy tests and native/fallback Chromium runs.
- [x] Visibility uses actual roots and shares/releases observers: multiple-root,
      SVG/table, equivalent options, cancellation, and real scrolling tests.
      Text-only/empty content opens immediately without an observation
      placeholder.
- [x] Media current/later match and cleanup: change-listener tests and real
      viewport resize.
- [x] Missing idle/intersection/media API fallbacks: strategy tests; documented
      eligibility rules.
- [x] Client-only factory evaluation, reactive tracking, thrown/invalid
      factory/getter handling: SSR and strategy/error tests; TypeScript rejects
      Promise factories.
- [x] Deduplication and urgent work independent of Activity background tasks;
      never is never queued automatically: queued-request/duplicate-intent and
      priority tests.

## 4. Interaction and nesting

- [x] Early root capture, keyboard/focus/non-bubbling enter: all 15 supported
      events in strategy tests and native Chromium coverage.
- [x] Parent-first ancestor resolution, Activity promotion, static ancestors, no
      recursive double setup: nested and unresolved-ancestor integration tests,
      including browser-only factories.
- [x] Trigger delivery once, controls/default actions/focus/propagation and replay
      limits: capture hydrates synchronously and continues the original event.
      Browser tests cover first-intent buttons, links, cancellation, forms,
      checkbox state, keyboard, focus, and propagation. No synthetic replay or
      trusted-event reconstruction is needed.
- [x] Events during queued hydration and removed/failed targets: synchronous
      promotion consumes current intent; revision guards retire queued work.
      Repeated events dispatch once each; invalidated targets cancel
      propagation/default action. No replay queue can outlive a target.
- [x] Lightweight unresolved descendants: root capture inspects enclosing SSR
      comments on intent; no descendant runtime objects or component setup just to
      discover policies.

## 5. Target integration and packaging

- [x] Client/server component exports, public types and `ripple/hydration`
      exports: packaging/type tests and server imports without browser globals.
- [x] Ripple-only target integration: existing lazy generic children support
      aliases/dynamic components/props. Target changes only record/check
      conditional identity; no shared TSRX source or syntax changes.
      `packages/tsrx-ripple/tests/hydrate.test.js`.
- [x] Server-safe helpers, tree shaking and diagnostics: server tests; browser
      build assertions exclude hydration machinery with `ssr: false` and remove
      unused Hydrate. Types reject missing `when`, async factories, unsupported
      events, `split` and `prefetch`; runtime rejects invalid policies.
- [x] Vite/adapter CSS and async payload lifetime audit: Vite already extracts
      statically imported child CSS and collects transitive manifest CSS. Adapter
      static serving requires no change. Existing root context retains
      payload/transport. Production-browser tests verify never-content styling
      after SSR inline styles are removed; streaming/transport tests verify data
      lifetime. No integration source changes are needed.

## 6. Validation and documentation

- [x] Strategy tables cover defaults/options, immediate/later satisfaction,
      repeated notifications, replacement, cleanup, and cancellation.
- [x] SSR HTML/DOM retention, no child initialization/effects before opening,
      once-only completion and later reactivity: hydration/client/server suites.
- [x] SSR factories, reactive conditions, option changes, never-static and client
      navigation: dedicated contract tests.
- [x] Nested strategies, Activity, parent-first intent and static ancestors:
      nested/unresolved-ancestor tests and real keyboard intent.
- [x] Updates, root isolation, serialized async values, streaming, mismatch/error
      handling, waiting/queued removal: integration tests.
- [x] Real-browser viewport/media/idle and native event/default-action coverage:
      `tests/browser/hydrate.js` using the existing Playwright/Vite dependencies.
- [x] Large-section initialization and separate download reporting: browser
      fixture checks 0 versus 2,500 initial row initializations with the same
      script request count; records raw/gzip bundle bytes and timings.
- [x] Required validation commands are listed below and run for this change; the
      generated hydration fixtures track compiler output.
- [x] `.tsrx` guide/examples, defaults, mounting, early-update exceptions,
      nesting/events, Activity distinction, package README, website navigation,
      `website/public/llms.txt`, browser instructions, and patch changesets for
      `ripple` and `@tsrx/ripple`.

## Validation commands

```bash
pnpm test --project ripple-client --project ripple-server --project ripple-hydration --project tsrx-ripple
pnpm --filter ripple exec node tests/browser/hydrate.js
pnpm --filter ripple exec node tests/browser/activity.js
pnpm typecheck
pnpm format:check
pnpm changeset:check
```

Automatic code splitting, procedural/strategy prefetch, and chunk-loading fallback
parity are explicitly excluded by the issue's scope, not deferred milestones of
this implementation. Event delivery is synchronous, so no synthetic replay
fidelity or asynchronous replay queue is claimed.
