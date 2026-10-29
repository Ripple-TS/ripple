<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/Ripple-TS/ripple/master/assets/ripple-dark.png">
  <img src="https://raw.githubusercontent.com/Ripple-TS/ripple/master/assets/ripple-light.png" alt="Ripple - the elegant TypeScript UI framework" />
</picture>

# What is Ripple?

[![npm version](https://img.shields.io/npm/v/ripple?logo=npm)](https://www.npmjs.com/package/ripple)
[![npm downloads](https://img.shields.io/npm/dm/ripple?logo=npm&label=downloads)](https://www.npmjs.com/package/ripple)

Ripple is an elegant TypeScript UI framework. To find out more, view
[Ripple's Github README](https://github.com/Ripple-TS/ripple).

See the [CSP guide](https://ripple-ts.com/docs/guide/content-security-policy) for
nonce rendering, the application-owned `ripple/csp` Trusted Types contract,
`getCspHashes()` for prerendered output, and runnable browser-tested examples.

Use `Activity` to retain hidden panels and their component state while
disconnecting user effects. Pass a tracked or derived `mode` for reactive
visibility; it defaults to `'visible'`. Hidden server-rendered panels hydrate one
boundary per background task, and activation promotes queued work. See the
[Activity guide](https://ripple-ts.com/docs/guide/activity) for lifecycle, refs,
portals, and scheduling details.

Use `Hydrate` with `load`, `idle`, `visible`, `interaction`, `media`, `condition`,
or `never` from `ripple/hydration` to defer initialization of visible server HTML.
`when` is mandatory; factories are synchronous and client-only. Boundaries open
once, preserve their owner/context and live input edits, and compose with
Activity. Client-only mounts render normally, even for `never()`. This does not
split code or reduce JavaScript downloads. See the
[Hydrate guide](https://ripple-ts.com/docs/guide/hydrate) for defaults, reactive
policies, early-update rules, nesting, events, and completion timing.

## Async values and streams

`trackAsync(compute)` accepts a promise, an async iterable, a promise resolving to
an async iterable, or `{ promise, abortController }`. `compute(previous)` receives
the last accepted producer value (initially `undefined`). Each yield replaces
`.value`; accumulate inside a generator when you want an expanding list. Arrays,
strings and synchronous iterables returned by promises remain ordinary values.
Read reactive query inputs in the synchronous callback before creating a
generator:

<!-- prettier-ignore -->
```tsrx
const result = trackAsync<Snapshot>((previous) => {
  const account = selectedAccount.value;
  const saved =
    previous?.account === account ? previous : undefined;
  return (async function* () {
    let rows = saved?.rows ?? [];
    const batches = await readRows(account, saved?.cursor ?? 0);
    for await (const batch of batches) {
      rows = [...rows, ...batch.rows];
      yield { account, cursor: batch.cursor, rows };
    }
  })();
});
```

Here `Snapshot` is the application's `{ account, cursor, rows }` type and
`readRows` is a resumable source, such as an imported `module server` function.
Only its explicit arguments cross RPC. Keep accepted snapshots immutable; writes
to a tracked value for temporary display do not advance its resume checkpoint.

`getTrackedStatus(handle)` replaces `trackPending`:

- `pending`, `complete: false`: the current query has no result yet.
- `ready`, `complete: false`: a stream has a readable value but has not completed.
- `ready`, `complete: true`: a promise resolved, an iterator naturally completed,
  or a synchronous tracked/derived value is ready.
- `error`, `complete: false`: the source failed; reading its value still follows
  the usual error-boundary path.

Status is reactive and never suspends. Derived completion follows only its current
dependencies; a derived can produce a ready fallback while remaining incomplete.
Completion alone does not publish another value. Incompleteness is not a
connection health indicator or a promise of another yield.

Replace `trackPending(value)` with `getTrackedStatus(value).state === 'pending'`.
Use `state === 'ready'` to guard value access, rather than treating an error as
ready. For the removed callback form, first create a named derived with
`const total = track(() => first.value + second.value)`, then inspect `total`.

SSR, buffered rendering and prerendering consume exactly the first yield and
release the iterator. The existing hydration snapshot carries a continuation flag;
no additional DOM markers or per-yield scripts are added. At activation, the
callback re-enters with that snapshot. A resumed iterator may complete without
yielding; an initially empty iterator is an error, while yielding `undefined` is
valid. Promises need no continuation. The callback must be safe to restart using
an application cursor or a fresh authoritative snapshot; generator stacks are not
preserved across requests.

Keep the first continuation value by default: it may contain changes since SSR or
a disconnect. Each yield replaces the tracked value. Receiving the same array
snapshot again does not append duplicate rows; keyed lists can reuse matching
rows, and unkeyed lists update or replace their rendered items. An unchanged
primitive or rendered field can avoid a DOM write. Publications still notify
consumers, including for equal primitives, so effects or dependent requests can
run again even when the visible output stays the same.

If a source guarantees that its first item on continuation repeats the accepted
snapshot, a callback-local flag can suppress that one replay without a payload ID.
Keep the initial result and the first result of a changed query or fresh refresh.
Wrap payloads that can be `undefined` in an ordinary `{ data }` snapshot so
accepted undefined values can be distinguished from no previous result. A fresh
current snapshot may contain changes and should not be blindly skipped. See the
[first-yield suppression example](https://ripple-ts.com/docs/guide/async-data#suppressing-a-replayed-first-yield).

An open stream keeps its latest accepted value readable between yields and during
recognized RPC transport recovery. Recovery makes up to three attempts with
bounded backoff, re-entering the callback to build fresh arguments. Application
errors, invalid frames, permanent rejections and ordinary mutation RPCs are not
retried. Query changes and disposal revoke old attempts and cancel their owned
requests. Dependency-driven refetches retain the existing pending semantics. Use a
tracked revision for explicit refresh, a keyed owner for a fresh reset, and
`@catch(error, reset)` for retrying a failed owned branch.

`Hydrate` still controls when component-owned sources initialize: incomplete data
does not open a gate, and `never()` or removal before activation starts no
request. For early updates with deferred view initialization, create one source in
an active ancestor and pass it through props or Context. Deferred views reuse that
owner's reader. Hydration-disabled output retains only the initial snapshot.

### View transitions

`ViewTransition` and `createViewTransition` provide transparent, explicitly
activated browser animations for local state changes and shared elements.
Transition selectors in scoped style blocks are local by default; `:global(...)`
provides shared recipes. `auto` preserves browser defaults and `none` disables
participation. Boundaries add no wrapper, hydration marker, or template
placeholder. See the
[ViewTransition guide](https://ripple-ts.com/docs/guide/view-transitions) for the
API, scoped/global CSS recipes, async coordination, and browser fallbacks.
