# Ripple SSR Streaming — Design & Implementation Plan

Status: IMPLEMENTED (branch `stream`, July 2026) — commits ce86ac880 (server
core), 7e24765e7 (client activation), f2bb54572 (head streaming), 81dbc2df4
(vite-plugin `ssr.streaming`), cc2ec91a5 (benchmarks vs React 19). Deviations from
the draft: no rethrow-based suspension detection (boundaries check for async ops
registered on them after the body runs, preserving the non-streaming "holes"
model); the root boundary's slot is emitted as the whole body so slot markers are
always owned by the boundary at the anchor; runtime prefixes are ripple-branded
(`__RIPPLE_S__`, `__RIPPLE_B__`, `data-ripple-chunk`, `__ripple_ta_`). Remaining
follow-ups: §2.7 abort/timeout + client takeover, route-level CSS manifest,
`remove_ssr_css` late-style pass, playground/e2e run. Scope: `packages/ripple`
(server runtime, client runtime, hydration) and streaming plumbing in
`packages/vite-plugin`. **No compiler changes required** — the tsrx-ripple
transforms are streaming-agnostic (verified below).

## 0. Where we are today (verified against source)

Non-streaming SSR renders to completion: `render()` runs the tree, async
`trackAsync` work re-runs blocks on resolution (`register_block_rerun` →
`run_block`), a root pending-counter on the root `Output` resolves
`output.promise` when everything settles, and the caller gets
`{ head, body, css }`. Pending fallbacks never render in this mode.

Compiler facts that constrain the design:

- The server transform compiles `@try/@pending/@catch` to
  `_$_.try_block(try_fn, catch_fn, pending_fn)` and wraps each branch body in
  literal `output_push('<!--[-->') … output_push('<!--]-->')` **inside the
  generated functions** (`tsrx-ripple/src/transform/server/index.js:1552-1628`).
  The markers are baked into batched `__out` strings by
  `accumulate_output_pushes`. So we cannot cheaply parameterize the compiled
  markers; any streaming-specific marker must be added by the runtime _around_ the
  compiled output.
- Async-ness is **not known at compile time**: `await` is a compile error in
  components; asyncness flows only through `trackAsync`, which carries a
  compile-time hash used for SSR result serialization
  (`<script id="__ripple_ta_<hash>" type="application/json">` envelopes) and
  client-side hydration lookup (`client/runtime.js:611`).
- Client `@try` compiles to `_$_.try(anchor, try_fn, catch_fn, pending_fn)`;
  during hydration the boundary consumes the opening `<!--[-->` and marks itself
  pre-resolved because today's SSR output is always settled
  (`client/try.js:314-326`).

A streaming skeleton exists but is incomplete/broken past the shell:

- `create_ssr_stream()` + `render(App, { stream: sink })` exist
  (`server/index.js:189`, `:721`). Stream mode has a **sync phase**
  (`Output.#sync_run`); `run_block` re-throws `ASYNC_DERIVED_READ_THROWN` during
  it (`server/index.js:1903-1913`) so `try_block` renders the pending fallback
  (`server/blocks.js:92-98`). Shell head+body is pushed after the sync phase.
- After the sync phase, `Output.#push` pipes every write raw to the sink with no
  framing (TODO at `server/index.js:522`); `register_css` silently drops
  post-shell CSS (TODO at `:589`).
- **Orphaned-buffer bug**: when a try suspends in the sync phase,
  `created_block.o.clear()` empties the unit's buffer before rendering the
  fallback. The suspended inner block's re-run later writes into its branch arrays
  — which were detached from the flushed tree by `clear()`. The partially-rendered
  static HTML of the try body is also lost. Any real streaming implementation must
  stop discarding the partial body (§2.3).
- **Catch-only async bug**: in stream mode, a catch-only `try` with an async body
  gets the rethrown `ASYNC_DERIVED_READ_THROWN` sentinel delivered to `catch_fn`
  as if it were a user error (`server/blocks.js:100-115`).

## 1. Goals

1. First chunk (**shell**): everything synchronous; each suspended `try`/`pending`
   boundary shows its fallback; all CSS registered so far goes with it — flushed
   immediately after the sync pass.
2. Each async boundary streams its real HTML **out of order** as soon as its own
   subtree settles — no waiting on siblings, no waiting on still-pending
   descendants (they stream later into their own slots).
3. Catch-only async `try`: zero-size comment slot in the shell; the resolved body
   — or the **server-rendered** catch HTML on failure — streams into the slot
   later. Catch is not deferred to the client: streaming must preserve
   non-streaming SSR semantics (no-JS correctness, no duplicate client work).
4. Hydration is **top-down and incremental**: the shell hydrates as soon as app JS
   runs; each streamed boundary hydrates independently on chunk arrival.
   Leaf-first ordering is explicitly rejected — it would delay shell interactivity
   for no benefit, and server flush order (parents before children, §2.4) makes
   arrival-order hydration always safe.
5. No FOUC: shell CSS in the first chunk; late-discovered CSS ships in the same
   chunk as — and before — the HTML that needs it.

## 2. Server design

### 2.1 Flush units

A **flush unit** is the granularity of streaming, decided at runtime by actual
suspension (compile time cannot know):

- `try` + `pending` (± `catch`) whose body suspends in the sync phase: fallback in
  the shell, content streamed later.
- `try` + `catch`-only whose body suspends: empty slot in the shell, content (or
  catch HTML) streamed later. Fixes the sentinel bug: on
  `ASYNC_DERIVED_READ_THROWN` with only `TRY_CATCH_BLOCK`, treat as suspension,
  not as an error.
- The root render (already wrapped in a `try_block` with `options.rootBoundary`)
  is a flush unit, so a top-level async error still streams the root catch into
  the shell slot.
- A unit can also be _created after the shell_: a boundary nested inside another
  unit's content that suspends during the parent's re-run.

Try blocks that complete synchronously are not flush units and their output is
byte-identical to today's.

Units get monotonically increasing numeric ids at suspension time.

### 2.2 Marker protocol (runtime-owned, zero compiler change)

Compiled code already emits `<!--[-->fallback<!--]-->` inside `pending_fn`. The
runtime adds a **wrapper pair only on the suspended path** (inside `try_block`'s
sentinel catch, where it currently clears + renders fallback):

```html
<!--[?N-->
<!--[-->fallback…<!--]-->
<!--]-->
← try+pending unit in shell
<!--[?N-->
<!--]-->
← catch-only unit (empty slot)
```

- `[?N` = "slot N, still pending". Non-suspended blocks keep plain `[` — the
  common case has no protocol or byte-size change.
- The client swap runtime **normalizes the DOM after swapping**: it removes the
  fallback range and the wrapper comments themselves, leaving exactly the
  `<!--[-->content<!--]-->` the compiled body pushed — byte-identical to
  non-streamed resolved SSR. A boundary swapped before hydration therefore
  hydrates through today's unmodified resolved path.
- Only when hydration reaches a **still-pending** `[?N` marker does new client
  logic engage (§3).
- `hydration.js` marker checks (`data === HYDRATION_START`,
  `skip_to_hydration_end`) become prefix checks (`startsWith('[')`, with `]`
  unchanged) so wrapper markers nest correctly during the shell walk.

### 2.3 Keep the partial body: detach, don't clear

On suspension, `try_block` currently does `block.o.clear()`. Instead:

- **Detach** the unit Output's current `#body`/`#head` arrays as the unit's
  _content tree_ and install fresh empty arrays for the fallback. The nested
  branch `Output`s of child blocks still hold references to their own arrays
  _inside_ the detached tree — so when `register_block_rerun` re-runs a suspended
  inner block, its output lands exactly where it belongs in the content tree, and
  the try body's already-rendered static HTML is preserved. This mirrors
  non-streaming semantics (where nothing is cleared) and deletes the
  orphaned-buffer bug instead of working around it.
- The existing "clear + cancel" path remains for the _error_ route (catch
  rendering discards the broken body — correct today, correct here).

Post-sync-phase writes stop going straight to the sink (`Output.#push` stream
branch is removed). All writes go to buffers; only the flusher touches the sink.

### 2.4 Settle tracking and flushing

- Per-unit pending counter: `register_block_rerun` currently registers the async
  op on the closest **catch** block's Output and bumps only the root counter.
  Change: register on the nearest **flush unit** (which also bubbles to the root
  counter so `output.promise` / `closeStream` keep working).
- A unit settles when its counter hits zero. Its content tree is then complete
  except for **nested units**:
  - Nested unit already settled → its content tree is inlined (recursively) at
    serialization time, _without_ wrapper markers — coalesced into one chunk, one
    swap.
  - Nested unit still pending → serialize its wrapper + fallback; it flushes later
    as its own chunk. This yields the invariant: **a unit's chunk is emitted only
    after the chunk (or shell) containing its slot** — parents always precede
    children on the wire.
- All sink pushes go through one serialized `flush_unit(id)` on the root so
  concurrent settles can't interleave bytes.

Chunk framing:

```html
<style data-ripple-ssr>
  …new css…
</style>
<!-- if any -->
<script id="__ripple_ta_<hash>" type="application/json">
  …
</script>
<!-- envelopes -->
<template data-ripple-chunk="N">…content…</template>
<script>
  __RIPPLE_S__(N);
</script>
```

`__RIPPLE_S__` is a ~300-byte inline runtime emitted once at the end of the shell.
Behavior in §3.

Error path: if a unit's body ultimately errors, the server renders the catch
branch into the unit (existing `route_error_to_catch_block` machinery) and flushes
the same framing. `trackAsync` failures already serialize an error envelope
(`__ripple_ta_<hash>` with `ok:false`), which is what drives the client to hydrate
the catch branch (it re-throws during the try-body walk — `client/runtime.js:624`
— and `handle_error` claims the streamed catch DOM). For non-trackAsync errors
(rare: block fn throws post-resolve), add a unit-level error envelope
`<script id="__ripple_te_N">` so activation can route to the catch branch
deterministically instead of relying on the client re-throwing the same way.

### 2.5 CSS

- Shell: flush all hashes registered during the sync phase as
  `<style data-ripple-ssr>` ahead of the body (fixes TODO at
  `server/index.js:757`). In stream mode `render` owns this; the head/body split
  contract with the embedder is defined in §5.
- Root keeps a `sent_css` set. On each flush, `unit css − sent_css` is emitted as
  a `<style data-ripple-ssr>` **before** the `<template>` in the same chunk.
  Template content is inert until the swap script (which follows the style in
  document order) runs — styled-on-arrival by construction, no FOUC.
  `Output.register_css` in stream mode routes to the nearest flush unit instead of
  dropping (fixes TODO at `:589`).
- "All CSS for the whole page upfront" is not knowable at runtime (async content
  hasn't rendered). If wanted later, it's a bundler feature — a route-level CSS
  manifest in `vite-plugin` — not a runtime one. Per-chunk delivery already
  guarantees no unstyled content is ever visible.
- Client `remove_ssr_css()` currently strips `style[data-ripple-ssr]` once at
  hydrate start; it must not remove styles for chunks whose client-side CSS hasn't
  loaded. Re-run its load-watcher after stream close (registry knows when no `[?`
  slots remain).

### 2.6 trackAsync envelopes and head writes

- Envelopes already route through the owning block's Output
  (`push_serialized_result`), so they land in the unit's chunk automatically — in
  the document before the swap script runs, preserving the client's synchronous
  `getElementById` lookup.
- `<head>`-targeted output produced after the shell (`set_output_target('head')`)
  can't be appended to the real head as raw HTML. Emit it as
  `<template data-ripple-head="N">`; the swap runtime moves its content into
  `document.head`.

### 2.7 Backpressure / cancellation (design now, ship later)

`render` options grow `signal?: AbortSignal` / `streamTimeout?: number`. On abort:
cancel outstanding ops (`cancelAsyncOperations` exists), emit
`<script>__TSRX_X__()</script>` marking remaining open slots as client-takeover
(client re-runs those try bodies with client trackAsync), close the stream. The
chunk protocol reserves the marker; iteration 1 ships without it.

## 3. Client design

### 3.1 Two arrival races, two cheap answers

A chunk arrives either before or after `hydrate()` has walked its slot:

- **Before hydration**: `__RIPPLE_S__` swaps pure DOM — find comment `[?N`,
  depth-aware scan to its wrapper `]`, remove fallback range and both wrapper
  comments, insert template content, record N as done. The DOM is now
  byte-identical to non-streamed SSR; hydration later needs zero new logic.
- **After hydration**: the shell walk hit a live `[?N` marker. New branch in
  `client/try.js` hydration setup: hydrate the **fallback** as the pending branch
  (`has_resolved = false`, `mode = 'pending'` — today's code instead forces
  `has_resolved = true`), register `{ activate(template) }` in
  `window.__RIPPLE_B__[N]` (registry shared with the inline runtime), and
  `skip_to_hydration_end()` past the slot. When the chunk arrives, `__RIPPLE_S__`
  sees the registry entry and calls `activate` instead of touching DOM itself.

### 3.2 `activate(template)` — boundary-scoped hydration

1. Remove the fallback range (destroy the pending branch block), insert the
   template content between the wrapper comments, drop the wrappers.
2. Scoped hydration: save hydration globals, `set_hydrating(true)`,
   `set_hydrate_node(first inserted node)`, run the try body via the existing
   `render_resolved()` path inside `with_block(try_block, …)`, restore globals.
   The try body _claims_ the streamed DOM through the standard hydration walk
   instead of creating fresh nodes.
3. `trackAsync` inside the body finds its envelope (same chunk, already in the
   document) and takes the existing `had_hydration_data` fast path — the
   `ok:false` envelope path likewise drives catch hydration unchanged.
4. Still-pending boundaries _inside_ the activated content hit the `[?M` branch of
   §3.1 and register themselves — activation recurses naturally, one chunk at a
   time, and §2.4's ordering invariant guarantees the parent boundary exists
   before any child chunk arrives.

This is the "parent ready ⇒ parent hydrates" model: shell first, then each
boundary on arrival; sibling order is irrelevant.

### 3.3 Stream end

`closeStream` already closes the sink when the root counter reaches zero. The
client needs no end signal: the registry is garbage once no `[?` markers remain;
`remove_ssr_css`'s final pass keys off the same condition.

## 4. Compiler impact

None required. Suspended-slot markers, ids, framing, and state all live in the
runtime, wrapped around the compiled `<!--[-->…<!--]-->` output. (Optional later:
a dedicated boundary-marker helper in the server transform would shave a few
bytes, but it buys nothing structural.)

## 5. vite-plugin / adapters

Today `render-route.js` / `production.js` await `{ head, body, css }` and do
string replacement into `index.html`. Streaming mode:

- Split the transformed template at `<!--ssr-body-->`; stream: template-prefix
  with `<!--ssr-head-->` replaced (head content + shell CSS + route data script) →
  shell body → unit chunks → template-suffix.
- `vite.transformIndexHtml` runs before splitting (dev).
- The hydration `<script type="module">` can stay in the suffix for iteration 1
  (pre-hydration swaps don't need it); moving it before the body placeholder later
  improves time-to-interactive.
- `render`'s streaming contract: shell CSS is emitted by `render` into the stream
  (before body), not returned as a set — document at the type level
  (`RenderStreamResult`).

## 6. Test plan

- `tests/server/streaming-ssr.test.tsrx`:
  - shell = sync content + fallback inside `[?N` wrappers + shell CSS; chunk
    framing per settle; `sent_css` dedup across chunks.
  - catch-only async → empty `[?N` slot, then body chunk; async failure →
    server-rendered catch chunk + error envelope.
  - nested: inner settles first → coalesced single chunk (no inner wrapper); outer
    settles first → two chunks, parent chunk precedes child chunk.
  - orphaned-buffer regression: static HTML around a suspended expression appears
    in the streamed chunk (today it would be lost).
  - randomized resolution order (N boundaries) → concatenated stream, after
    applying swaps, equals the non-streaming render byte-for-byte.
- `tests/hydration/`:
  - pre-hydration swap: apply `__RIPPLE_S__` to shell DOM, then `hydrate()` —
    passes through the existing resolved path.
  - post-hydration: hydrate shell with live `[?N`, assert pending branch is
    interactive; simulate chunk arrival (insert framing nodes + call
    `__RIPPLE_S__(N)`), assert activation claims DOM (no node recreation), events
    work, trackAsync consumed envelope, nested `[?M` registered.
  - catch: `ok:false` envelope and `__ripple_te_N` both hydrate the catch branch.

## 7. Sequencing

1. **Server core** (`server/index.js`, `server/blocks.js`): flush units + ids,
   detach-not-clear (§2.3), per-unit counters, `flush_unit` with framing
   - `sent_css`, catch-only sentinel fix, wrapper markers. Behind `options.stream`
     only — non-streaming path byte-identical.
2. **Inline swap runtime** (`__RIPPLE_S__` string constant + shell emission) and
   `hydration.js` prefix-matching. At this point pre-hydration streaming works
   end-to-end with zero client-package changes.
3. **Client** (`client/try.js`): `[?N` hydration branch, registry, `activate()`
   scoped hydration, `remove_ssr_css` awareness.
4. **CSS + head templates**, error envelopes.
5. **vite-plugin** streaming route path; docs (`website/public/llms.txt`).
6. Follow-ups: abort/timeout + client takeover, route-level CSS manifest, move
   hydration script pre-body.

## 8. Key decisions (recap of the questions asked)

- **What to send for async catch-only try?** An empty `[?N` comment slot in the
  shell; the body — or server-rendered catch HTML — streams into it. Catch is
  rendered on the server, same slot, preserving non-streaming SSR semantics;
  client-only catch rendering is rejected (no-JS breakage, duplicated work, SEO).
- **Nested tries — what ships when?** A unit flushes when _its own_ async work
  settles; settled descendants coalesce into the parent chunk, pending ones ship
  their fallback and stream later. Parents always hit the wire before children.
- **Hydration order — leaf-up or parent-first?** Parent-first, incremental. The
  shell hydrates immediately; each boundary hydrates on chunk arrival (or, if the
  chunk beat hydration, through the normal resolved path after DOM normalization).
  The wire-order invariant makes this race-free without any leaf-tracking
  bookkeeping.
