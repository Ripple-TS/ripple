# Client Async `track(() => ...)` Plan

## Goal

Move client-side async behavior away from component-level `await` and async
component compilation, and toward suspension-aware reads of
`#ripple.track(() => ...)` derived values.

The target model is:

- Components remain regular synchronous functions.
- `await` is prohibited everywhere inside components.
- The only supported client-side async primitive inside components is
  `track(() => ...)`.
- A function-valued `track()` may return either a synchronous value or a promise.
- If a read encounters a promise and there is no cached resolved value, the
  nearest parent `try { ... } pending { ... }` boundary suspends.
- If a read encounters a promise and there is already a cached resolved value,
  rendering continues with the cached value and the new promise updates the
  derived later.
- Promise rejection routes to the nearest parent `try { ... } catch { ... }`
  boundary using the current block tree behavior.
- If the originating block has been destroyed by the time a promise settles,
  nothing happens.

## Public Types

The public `track()` types should be updated to reflect async function-valued
usage.

- The function overload should allow the passed function to return either a value,
  a promise, or an object with the shape `{ promise, abortController }`.
- The public type should continue to expose the resolved value shape to reads.
- In practice this likely means the function overload becomes conceptually
  equivalent to
  `() => V | PromiseLike<V> | { promise: PromiseLike<V>, abortController: AbortController }`
  and still returns `Tracked<V>`.
- The non-function and already-tracked overloads stay unchanged.
- `DERIVED_UPDATED` should be exported from `ripple` as a public symbol so user
  code can detect Ripple-driven aborts in its own handlers when it shares the same
  abort signal.

This document is client-only. Hydration and SSR follow-up work is out of scope
here.

## Finalized Behavior Rules

### Core Rule

`track(() => ...)` is the async-capable primitive.

- `await` is not allowed inside components at all.
- Client-side component async behavior must be expressed through
  `track(() => ...)` only.
- The function is evaluated during normal derived evaluation.
- If it returns a non-promise, the derived behaves like a normal synchronous
  derived.
- If it returns a promise, the derived enters async request handling.
- If it returns an object of the shape `{ promise, abortController }`, the derived
  enters async request handling with explicit abort support.

### Boundary Ownership Rule

An async `track(() => ...)` read always uses the closest upstream boundary.

- That boundary may be declared in the same component as the read.
- That boundary may be declared in a parent component.
- The async derived does not own or create a boundary.
- The runtime resolves the boundary from the active block ancestry at read time.
- If no upstream `try { ... } pending { ... }` boundary exists, the async read is
  invalid for client render-time execution.

### Read Semantics

Reading an async-capable derived has two distinct modes.

#### Mode 1: Cached Value Exists

If the derived already has a previously resolved value:

- Return that cached value synchronously.
- Continue the current render normally.
- Start or attach to the newly returned promise, whether it came back directly or
  via `{ promise, abortController }`.
- When the promise resolves, update the derived value and schedule the owning
  block to rerender.
- When the promise rejects, route the error to the nearest catch boundary, if the
  source block is still alive.
- Do not enter pending in this mode.

This is stale-while-revalidate behavior.

#### Mode 2: No Cached Value Exists

If the derived has no previously resolved value:

- Evaluate the function.
- If the result is a promise, register an async request.
- If the result is `{ promise, abortController }`, register an async request with
  explicit abort support.
- Find the nearest parent pending boundary.
- Enter pending for that boundary.
- Stop executing the current render path at that point.
- Do not continue evaluating downstream expressions in the same block.
- When the promise resolves, update the derived and schedule a rerender.
- When the promise rejects, route the error to the nearest catch boundary.

This is first-load suspension behavior.

### Destroyed Block Rule

If a promise settles after the originating block has been destroyed:

- Do nothing.
- Do not update the derived.
- Do not rerender.
- Do not attempt to enter or leave pending.
- Do not attempt to render catch.

This covers cases where the async read happened inside conditional or switched
control flow and the subtree no longer exists.

### Boundary Reference Rule

It is acceptable to store references to the source block and boundary for an async
request, but they are only valid if they are still alive when the promise settles.

- The source block is the primary liveness check.
- If the source block is destroyed, the request is ignored.
- If the boundary block is destroyed, the request is ignored.
- If both are still alive, resolution or rejection is applied to that same
  boundary instance.

Because this runtime destroys and recreates control-flow subtrees rather than
reparenting live blocks, a live source block implies that the surrounding boundary
structure is still the same relevant one for that request.

### Promise Version Rule

Each async derived evaluation must be versioned.

- If a second async evaluation starts before the first settles, the older promise
  becomes stale.
- A stale promise settling later must not overwrite newer state.
- A stale promise must not clear pending state for the newer request.

Each request needs a token or version number so only the latest active request for
that derived is allowed to commit.

### Abort Rule for Superseded Requests

When an async derived is reevaluated while an older async request is still in
flight, Ripple should attempt to abort the older request rather than simply
waiting for it to become stale.

- Abort support is enabled when the async `track()` callback returns an object of
  the shape `{ promise, abortController }`.
- When a reevaluation starts a newer request, the previously running request may
  be aborted if it is still the active request for that derived version.
- Before aborting, Ripple should check whether the previous request's signal is
  already aborted.
- If the signal is already aborted, Ripple must not call `abort()` again, since
  the user's code may already have aborted it.

Ripple should use `DERIVED_UPDATED` as the abort reason for superseded requests.

- `DERIVED_UPDATED` should be a unique symbol exported from `ripple` for public
  use.
- Internally it should also be exposed through the `_$_` namespace so generated
  code and runtime helpers can use the same symbol.
- That reason indicates that the request was superseded by a newer derived run.
- The `promise.catch((reason) => ...)` handler attached by Ripple must check for
  this reason.

When a derived reruns and abort support is present:

- Ripple should call `abortController.abort(DERIVED_UPDATED)` on the previous
  request if `abortController.signal.aborted === false`.

If a rejection is caused by `DERIVED_UPDATED`:

- do not render the catch block
- do not treat it as a user-visible failure
- do not let the older request clear or replace the newer pending state
- keep the boundary in pending if a newer uncached request is still active
- otherwise ignore the old request completely

If a rejection is caused by some other reason:

- treat it as a normal rejection
- route it through the nearest catch boundary if the source block is still alive

People using the same abort signal in their own code must also treat
`DERIVED_UPDATED` as a non-error control-flow reason.

This distinction allows Ripple to cancel obsolete user work, such as `fetch()` or
other abortable async operations, without surfacing those internal cancellations
as errors in `try/pending/catch`.

### Multiple Async Reads in the Same Block

Uncached async reads in the same render block are sequential.

- The first uncached async read suspends the block immediately.
- Code after that read in the same block does not run in that pass.
- After the promise resolves, the block reruns from the top.
- The next uncached async read may then suspend in the same way.

This is required because downstream code in the same block may depend on the
earlier async result.

### Multiple Async Branches Under the Same Boundary

Different child blocks under the same `try/pending` boundary may suspend
independently, but a shared boundary reveals as a group.

- Each child block may start its own async request.
- Each request may resolve or reject at different times.
- Each child block may schedule its own rerender when its request settles.
- However, the shared pending boundary stays active until all unresolved uncached
  requests registered with that boundary are finished.

Therefore:

- A single boundary means grouped pending and grouped reveal.
- Independent reveal requires separate boundaries.

### Pending Boundary Rule

Pending is boundary-scoped, not request-scoped.

- A boundary enters pending when its active async request count goes from `0` to
  `1`.
- A boundary stays pending while the count is greater than `0`.
- A boundary leaves pending only when the count returns to `0`.

This means the boundary should not leave pending as soon as the first of several
active requests resolves.

### Catch Boundary Rule

Promise rejection uses the same boundary-routing model as existing client errors.

- Rejection should not depend on a later throw during rerender.
- Rejection should route immediately using parent block traversal from the
  captured source block.
- The nearest parent try block with a catch handler handles the error.
- The try boundary then destroys the currently shown pending/resolved subtree and
  renders the catch branch directly.

This matches the existing `handle_error(error, block)` model.

### Rerender Rule

Promise fulfillment updates state first, then schedules rerender.

- When a promise resolves successfully, the derived stores the resolved value.
- The owning block is scheduled for update.
- Dependent reads rerun naturally through the existing scheduler.

Promise rejection does not need a regular value rerender to find the catch
boundary.

- The rejection can route directly to the catch boundary.
- If the catch branch itself depends on tracked state, its rendering proceeds
  through normal block creation and update semantics.

### What Does Not Happen

- The runtime does not continue executing downstream code in the same block after
  an uncached async read suspends.
- The runtime does not remove pending when only one of several active requests
  under the same boundary resolves.
- The runtime does not do anything when a settled promise belongs to a destroyed
  source block.
- The runtime does not allow `await` inside components for this feature.
- The runtime does not need to wait for all promises across unrelated boundaries
  before rerendering individual child blocks.

## Runtime Update Plan

## Keep

Keep these existing client-side concepts and use them as the basis of the new
flow.

- Block tree ownership and liveness checks.
- `is_destroyed(target_block)` semantics.
- `schedule_update(block)` and the current scheduler.
- Parent traversal for error routing via `handle_error(error, block)`.
- `try.js` as the owner of pending/catch DOM replacement logic.
- Existing branch pause/resume and DOM movement behavior for try boundaries.

## Modify

### 1. Extend Derived Runtime State

Derived values need async bookkeeping in addition to `__v`, dependencies, and
clock.

Add fields conceptually equivalent to:

- current request version
- current in-flight promise
- current request abort controller or equivalent abort handle
- whether the current async result came from the `{ promise, abortController }`
  object form
- whether a resolved cached value exists
- optional current source block reference
- optional current boundary reference
- whether the current request is contributing to boundary pending count

Exact field names can stay short for runtime size reasons.

### 2. Upgrade Derived Evaluation

Update derived evaluation so it can distinguish:

- synchronous return value
- promise return value
- object return value of the shape `{ promise, abortController }`

If synchronous:

- store value normally
- clear in-flight async request state
- proceed as a normal derived

If promise:

- create or update the request version
- capture the current source block
- find and store the nearest pending boundary
- attach fulfillment and rejection handlers
- either suspend immediately or return cached value depending on whether a
  resolved cached value exists

If object return value of the shape `{ promise, abortController }`:

- treat `promise` as the async request promise
- store `abortController` as the current abort handle for that request
- if an older request is still running and its abort controller exists and
  `abortController.signal.aborted === false`, call
  `abortController.abort(DERIVED_UPDATED)`
- capture the current source block
- find and store the nearest pending boundary
- attach fulfillment and rejection handlers to `promise`
- either suspend immediately or return cached value depending on whether a
  resolved cached value exists

### 3. Add Promise Detection Helper

The runtime should use promise-like detection rather than native `Promise` checks
only.

- treat thenables as async results
- do not force library users to return native promises only

### 4. Add Abort Support for Async Requests

Abort support should be integrated into async derived request management.

- Abort support is activated by the async callback returning
  `{ promise, abortController }`.
- Ripple stores the returned `abortController` for the active request.
- Ripple should be able to abort the previous in-flight request when a newer
  derived run supersedes it.
- Ripple should use `DERIVED_UPDATED` as the abort reason for superseded requests.
- The promise rejection handler should check for that reason and suppress catch
  rendering when the rejection was caused by Ripple's own abort.
- User-initiated aborts or other rejections should continue through normal error
  routing unless they explicitly match `DERIVED_UPDATED`.

### 5. Add Async Request Registration on Try Boundaries

The try boundary state in `try.js` should be extended from simple closure
callbacks into explicit request management.

The boundary should support operations conceptually equivalent to:

- begin request
- resolve request
- reject request
- check whether request is still active

The boundary must maintain:

- active request count
- pending DOM state
- suspended resolved DOM fragment
- catch rendering behavior
- request identity bookkeeping so stale or already-completed requests are ignored

### 6. Pending Entry and Exit

When an uncached async derived first suspends:

- register the request with the nearest boundary
- if this is the first active request for that boundary, schedule or render
  pending

When that request resolves:

- decrement the boundary request count if the request is still current
- only remove pending when the count reaches `0`
- restore or rerender the resolved subtree through existing block update behavior

### 7. Rejection Routing

When a promise rejects:

- first check whether the source block is still alive
- then check whether the stored boundary is still alive
- if not alive, ignore the result
- if the rejection reason is `DERIVED_UPDATED`, ignore it for catch rendering and
  leave boundary state owned by the newer request
- if alive, route the error using the same parent-traversal error model as the
  current runtime

This should align with current `handle_error(error, block)` behavior, not invent a
second error system.

### 8. Missing-Boundary Failure

When an uncached async read happens and no upstream pending boundary exists:

- treat that as invalid client render-time usage
- fail immediately at runtime during the transition period
- eventually rely on compiler enforcement to reject normal component code that can
  be proven to render an async read without an upstream boundary

### 9. Cached Value Semantics

Support stale-while-revalidate for async deriveds.

- If a cached resolved value exists, `get` or render-read returns it
  synchronously.
- The new promise remains in flight.
- Fulfillment updates the value and schedules rerender.
- Rejection routes to catch if still relevant.
- Pending is not shown while cached data is available.

### 10. Sequential Same-Block Suspension

No special mechanism is needed beyond immediate suspension.

- The first uncached async read stops execution of the current block.
- Later async reads in that same block are naturally deferred until rerender.

### 11. Shared-Boundary Group Reveal

Keep boundary-local active request counting.

- This is necessary for multiple sibling async requests under one boundary.
- Do not attempt to reveal the boundary after only one request finishes.

## Remove

Do not remove these immediately, but they are no longer part of the target model.

### 1. Async Component Dependence

The final design should not depend on components being compiled as async functions
to support client suspension.

### 2. Component `await` Support

Client components should no longer support `await` at top level, inside
`try/pending`, or anywhere else.

### 3. Rejection Handling Gaps in `async_computed`

The current `async_computed()` path only attaches `then` and leaves rejection
incomplete. That gap should be eliminated as part of the new async-derived path.

### 4. Await-Driven Client Runtime Helpers

The client runtime APIs whose main purpose is component-level `await` support
should be removed once the new model is complete.

This includes the client-side await-specialized path around:

- `maybe_tracked()`
- `async_computed()` as an await entry path
- `_$_.async(...)` as the mechanism for making component execution async

## Runtime File-Level Work

### `packages/ripple/src/runtime/internal/client/runtime.js`

Update:

- derived state shape
- derived evaluation path
- derived read path
- promise settlement handling
- stale request invalidation
- cached value behavior

Keep:

- scheduler
- dependency tracking
- block update flow
- parent traversal error routing

Add:

- promise-like detection helper for async derived returns
- nearest-upstream boundary lookup helper for pending-boundary discovery
- request registration helpers shared with `try.js`
- exported `DERIVED_UPDATED` symbol, also available internally through `_$_`

Likely reduce or replace:

- `get_derived()` so render-time reads can branch into async request handling
- `maybe_tracked()` should be removed after component `await` support is removed
- `async_computed()` should be removed or repurposed because async render reads no
  longer enter through `await`

### `packages/ripple/src/runtime/internal/client/try.js`

Update:

- boundary state so it can manage multiple async requests explicitly
- pending entry and exit based on active request count
- direct catch rendering for promise rejection routed from async deriveds
- explicit boundary request APIs, such as begin, resolve, reject, and membership
  checks

Keep:

- DOM replacement strategy for pending and catch
- boundary-local state ownership
- hydration-specific logic for existing try/pending semantics until hydration work
  is addressed separately

Add:

- request identity bookkeeping on boundary state
- helpers for resolving pending requests against the boundary instance
- suppression of catch rendering for `DERIVED_UPDATED` rejections

### `packages/ripple/src/runtime/internal/client/blocks.js`

Keep mostly as-is for block lifecycle, pause and resume, and DOM movement.

Remove:

- the explicit `_$_.async(...)` wrapper once component `await` support is removed
- any client block helper whose only purpose is top-level component async
  execution

### Runtime APIs to Add

Add runtime APIs conceptually equivalent to:

- nearest-upstream pending boundary lookup
- boundary request registration helpers
- exported `DERIVED_UPDATED` symbol, also available through `_$_`

No new public render-read helper is strictly required.

- The existing `_$_.get(...)` path can remain the read entry point.
- The async behavior can be implemented by upgrading derived evaluation and
  `get_derived()` / `run_derived()` semantics.

### Runtime APIs to Update

Update runtime APIs conceptually equivalent to:

- `get_derived()` / `run_derived()` or the render-read path so async derived
  values are handled
- `track()` so function-valued async results integrate with derived async state
- try-boundary state and handlers so multiple requests are tracked correctly
- async request creation so `{ promise, abortController }` results and
  `DERIVED_UPDATED` are handled

### Runtime APIs to Remove

Remove runtime APIs whose purpose is component-level `await` support:

- `maybe_tracked()`
- `async_computed()` if it remains await-specific
- `_$_.async(...)` in the client runtime once the migration is complete

## Client Compilation Plan

## Target Compiled Model

The target compile output should model async reads as ordinary render reads of
tracked values, resolved against the closest upstream `try/pending` boundary, not
as async component execution.

There are two primary compiled shapes to support.

### Shape A: Boundary in the Same Component

Source:

```ripple
component UserCard() {
  try {
    let user #ripple.track(() => fetchUser());
    <div>{@user.name}</div>
  } pending {
    <div>{'Loading...'}</div>
  } catch (error) {
    <div>{error.message}</div>
  }
}
```

Compiled shape:

```js
function UserCard(__anchor, _, __block) {
  _$_.push_component();

  _$_.try(
    __anchor_id,
    (__anchor) => {
      var user = _$_.track(() => fetchUser(), _$_.active_block);
      // Read resolves against the nearest upstream boundary, here the local try
      var value = _$_.get(user);
      _$_.render_text(__anchor, value.name);
    },
    (__anchor, error) => {
      _$_.render_text(__anchor, error.message);
    },
    (__anchor) => {
      _$_.render_text(__anchor, 'Loading...');
    },
  );

  _$_.pop_component();
}
```

The important property is that the component stays synchronous and the local try
boundary is only a boundary declaration. The async behavior still originates from
the render read.

### Shape B: Boundary in an Upstream Parent Component

Source:

```ripple
component Parent() {
  try {
    <Child />
  } pending {
    <div>{'Loading parent boundary...'}</div>
  } catch (error) {
    <div>{error.message}</div>
  }
}

component Child() {
  let user #ripple.track(() => fetchUser());
  <div>{@user.name}</div>
}
```

Compiled shape:

```js
function Parent(__anchor, _, __block) {
  _$_.push_component();

  _$_.try(
    __anchor_id,
    (__anchor) => {
      Child(__anchor, {}, _$_.active_block);
    },
    (__anchor, error) => {
      _$_.render_text(__anchor, error.message);
    },
    (__anchor) => {
      _$_.render_text(__anchor, 'Loading parent boundary...');
    },
  );

  _$_.pop_component();
}

function Child(__anchor, __props, __block) {
  _$_.push_component();

  var user = _$_.track(() => fetchUser(), _$_.active_block);
  var value = _$_.get(user);
  _$_.render_text(__anchor, value.name);

  _$_.pop_component();
}
```

The important property here is that `Child` does not need its own boundary. The
`_$_.get(user)` call resolves against the closest upstream boundary already
present in the active block ancestry.

### Implication for Compilation

Compilation must not encode a direct dependency from a specific async `track()`
declaration to a specific same-level `try/pending` statement.

Instead:

- compilation emits boundaries where the source declares them
- compilation continues to emit normal tracked reads
- runtime ancestry determines which upstream boundary handles the async read

## Compilation Changes to Add

### 1. Update Public Type Generation and Declarations

The public `track()` types should be updated so function-valued `track()` can
return a promise.

### 2. Preserve Existing Read Compilation

The compiler does not need a new async-specific read helper for this design.

- Tracked expressions can continue to compile through the existing `_$_.get(...)`
  path.
- The async behavior belongs in the runtime implementation of derived evaluation
  and `get_derived()`.
- If an async `track()` function reads other tracked values, those dependencies
  simply cause the derived to reevaluate later. Reevaluation restarts the async
  request flow with versioning and stale-request protection.

### 3. Preserve Plain `get` for Imperative Reads

Not every tracked read should suspend.

Keep plain `_$_.get(...)` behavior for contexts such as:

- imperative helper logic
- event handlers
- non-render utility code
- other places where suspension semantics would be surprising or invalid

### 4. Add Full Component `await` Prohibition in Analysis

The compiler should reject `await` inside components in all positions.

This includes:

- top-level component bodies
- `try/pending` bodies
- nested control-flow inside components
- any other client-side component render path

## Compilation Changes to Modify

### 1. Component Generation

Move client component generation toward always-synchronous output.

During migration:

- new async track behavior must not depend on async component wrapping

Final target:

- client components are always synchronous

### 2. Tracked Expression Transform

The current client transform emits `_$_.get(...)` for tracked expressions, and
that is not the main place where async-track behavior needs to be introduced.

For this design:

- async `track()` behavior is driven by derived reevaluation, promise detection,
  request versioning, and boundary interaction in the runtime
- dependent tracked reads inside the async `track()` function only cause the
  derived to reevaluate later
- on reevaluation, the async function runs again and the runtime restarts the
  async request flow with stale-request protection

So this transform mostly stays as-is unless later implementation experience shows
that render-time and imperative reads need to be split.

### 3. Try Statement Semantics

Client try statement compilation should continue to establish pending and catch
boundaries, but those boundaries are now used by async derived reads rather than
by explicit upstream async-read resolution.

So:

- keep compiling `try/pending/catch` as explicit runtime boundaries
- treat those boundaries as generic upstream async-read boundaries

### 4. Component Call Sites

Component call-site compilation does not need to thread explicit async boundary
references into child components.

Instead:

- child components receive the normal active block context
- render-time async reads inside children resolve against that active ancestry at
  runtime
- no direct compile-time linkage is needed between a child `track(() => ...)` and
  a parent `try/pending`

## Compilation Changes to Remove

These are end-state removals, not necessarily first-step removals.

### 1. Component `await` as a Supported Client Pattern

Remove support for `await` inside components entirely.

### 2. Await-Driven Client Async Transform as the Main Path

Remove the current client-side component `await` transform path completely inside
components. (The regular functions with await can still exist).

### 3. Async Component Wrapping for Derived Reads

Reading an async derived must not require emitting an async component body.

### 4. Client Analysis Rules That Permit `await` in `try/pending`

Remove the client analysis exception that currently allows `await` inside
component `try/pending` regions.

## Suggested Migration Order

1. Add compiler errors that prohibit `await` inside components in all positions.
2. Update the public `track()` type overloads so function-valued async `track()`
   is represented accurately.
3. Update tests.
4. Implement runtime support for async function-valued `track()` with cached
   value, pending, and catch behavior.
5. Lock the runtime semantics with focused client tests, including parent-child
   upstream boundary cases.
6. Remove component-`await` runtime helpers and async component wrapping from the
   client path.

## Summary

The final client model is:

- async work originates from `track(() => ...)`
- `await` is prohibited inside components
- first uncached read suspends the nearest pending boundary
- that boundary may be local to the component or declared in an upstream parent
- cached reads continue synchronously
- superseded in-flight async requests may be aborted by Ripple via
  `abortController.abort(DERIVED_UPDATED)` and do not render catch when they
  reject with `DERIVED_UPDATED`
- same-block uncached async reads serialize naturally
- sibling blocks can resolve independently, but a shared boundary reveals as a
  group
- rejection routes to the nearest catch boundary using the existing block
  traversal model
- destroyed source blocks make settled promises no-ops
- client compilation shifts async semantics from component execution to
  render-time tracked reads
