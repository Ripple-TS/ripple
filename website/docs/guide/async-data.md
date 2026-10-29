---
title: Async Data
---

# Async Data

Use `trackAsync` for data supplied by a promise or an async iterable. It returns a
`Tracked<T>` handle: read `.value` in your template, an effect, or a derived value.
Consumers update when data arrives; component bodies do not rerun.

## Promises and pending UI

Create the source inside a component or an active component helper. Use `@try`,
`@pending`, and `@catch` to provide loading and error UI:

```tsrx
import { trackAsync } from 'ripple';

export function Greeting() @{
  @try {
    const message = trackAsync(() => Promise.resolve('Hello from Ripple'));
    <p>{message.value}</p>
  } @pending {
    <p>Loading…</p>
  } @catch (error, reset) {
    <button onClick={() => reset()}>Try again</button>
  }
}
```

A pending value suspends readers until a result is available. Use `trackAsync`
instead of `await` directly in a component body or `await track(...)`.
The default root boundary can handle async work too; when it is disabled, provide
an enclosing `@try` boundary yourself. See [application boundaries](./application#root-boundaries).

## Async iterables and previous values

The callback receives the last accepted producer value as `previous`, initially
`undefined`. Its result can be:

- An `AsyncIterable<T>`, including an async generator.
- A `PromiseLike<T | AsyncIterable<T>>`.
- `{ promise, abortController }`, where `promise` resolves to a value or an async iterable.

Existing zero-argument promise callbacks still work. Arrays, strings, sets, and
synchronous iterables resolved by a promise remain ordinary values.

Each outer `yield` **replaces** `.value`. Accumulate inside your generator if you
want to append rows. After the first yield, `.value` remains readable while waiting
for more values and during recovery of the same source. A yielded `undefined` is a
valid value. An initially empty iterable is an error; a continuation of an accepted
snapshot may finish without another yield and retain that snapshot.

This complete example uses a fixed dataset so its cursor can be resumed in a new
server instance. Replace the sample query with a database or service that supports
stable cursors for a real application:

```tsrx
import { getTrackedStatus, trackAsync } from 'ripple';

module server {
  const rows = Array.from({ length: 300 }, (_, index) => ({
    id: index + 1,
    text: `Row ${index + 1}`,
  }));

  export async function* readRows(afterId: number) {
    for (let start = afterId; start < rows.length; start += 100) {
      const batch = rows.slice(start, start + 100);
      yield { cursor: batch[batch.length - 1].id, rows: batch };
    }
  }
}

import { readRows } from server;

type Snapshot = {
  cursor: number;
  rows: Array<{ id: number; text: string }>;
};

export function Rows() @{
  @try {
    const result = trackAsync<Snapshot>((previous) => {
      const afterId = previous?.cursor ?? 0;
      return (async function* () {
        let rows = previous?.rows ?? [];
        const batches = await readRows(afterId);
        for await (const batch of batches) {
          rows = [...rows, ...batch.rows];
          yield { cursor: batch.cursor, rows };
        }
      })();
    });

    <>
      <p>{getTrackedStatus(result).complete ? 'All rows loaded' : 'Receiving rows…'}</p>
      <ul>
        @for (const row of result.value.rows; key row.id) {
          <li>{row.text}</li>
        }
      </ul>
    </>
  } @pending {
    <p>Loading rows…</p>
  } @catch (error, reset) {
    <button onClick={() => reset()}>Try again</button>
  }
}
```

Only `afterId` crosses the network on a browser RPC call. The outer generator
builds accumulated snapshots locally, and keyed rendering preserves existing rows.
Ripple never sends `previous` as an implicit RPC argument or automatically drops
the first yield after reconnecting. Publish a changed first value; filter a known
replay in your callback only when your source guarantees that it is a duplicate.

Treat accepted snapshots as immutable. A temporary write to `.value`, or a writable
derived used for optimistic display, does not advance the saved producer value.
Mutating an accepted object in place would also mutate that checkpoint; Ripple
does not deep-clone each publication.

### Keeping the first value

Keep the first yield on continuation unless you have a specific reason to suppress
a known replay. It can include changes made since SSR or while disconnected, so
accepting it brings the view up to date. You do not need a unique ID merely to
publish the first snapshot.

Every accepted `trackAsync` yield replaces the tracked value. Receiving an array
with the same rows again does not append another copy of those rows. A keyed
`@for` can reuse matching rows; an unkeyed loop updates or replaces its rendered
items to reflect the replacement array.

An unchanged value can leave the DOM unchanged. For example, rendering the number
`5` again can avoid rewriting the same text. Newly received arrays and objects
usually have new references, even when their contents are equal, so they can
trigger reactive work and reconciliation while producing the same visible output.
Component bodies do not rerun just because a source yields.

An accepted `trackAsync` yield still notifies its consumers, even for an equal
primitive. Effects and dependent async computations may run again, so unchanged
visible output does not mean zero work or no side effects. First-yield suppression
is an optional optimization for a source with a known replay contract.

### Suppressing a replayed first yield

If your source **guarantees that the first item on continuation repeats the last
accepted snapshot**, you can suppress that item without a unique ID in the
payload. Use a flag local to each callback invocation, enabled only when an
accepted snapshot already exists.

A subscription that starts with the **current** snapshot does not necessarily
make this guarantee: its first value may have changed since SSR or a disconnect.
Without a replay guarantee, accept that value or compare the relevant data with
an application-defined equality check. The absence of an ID is not evidence of
a duplicate.

For a fixed subscription with that replay guarantee:

```tsrx
import { trackAsync } from 'ripple';
import { subscribe } from './source';

type Snapshot = { data: number | undefined };

export function LiveReading() @{
  const result = trackAsync<Snapshot>((previous) => {
    let skipFirst = previous !== undefined;

    return (async function* () {
      const values = await subscribe();
      for await (const data of values) {
        if (skipFirst) {
          skipFirst = false;
          continue;
        }
        yield { data };
      }
    })();
  });

  <p>{result.value.data ?? 'No reading'}</p>
}
```

Here `subscribe()` is application-provided and returns an async iterable of
readings, directly or through a promise. The first run, including SSR, accepts its
first item. A same-source continuation skips exactly one replay, keeps the
accepted value readable, then publishes later items normally. If that continuation
finishes without another item, Ripple retains the accepted snapshot.

The ordinary `{ data }` wrapper distinguishes an accepted `undefined` reading from
having no snapshot yet. For payloads that cannot be `undefined`, you can yield
them directly and use the same `previous !== undefined` check.

For reactive queries, also store the query key and any refresh revision in the
snapshot. Skip only when those fields match the current inputs, read synchronously
in the outer callback. A changed query or refresh from the beginning must accept
its first result. Avoid a component-local "has run" flag: SSR and client setup are
separate executions, and an attempt may be canceled before accepting any value.

### Reactive inputs and refresh

Read query inputs in the **synchronous outer callback**, before creating a
generator. Reads first made after `await` or `yield`, including inside an async
generator's body, do not become automatic dependencies.

When an input changes, Ripple retires the old attempt, closes its iterator, aborts
owned requests, and ignores late results. The new query can be pending until its
first result. The callback still receives the last accepted producer value, so
include query identity in your snapshots and discard an incompatible cursor.
For example, `previous?.account === account` can decide whether a saved snapshot
belongs to the currently selected account.

For an explicit refresh, read a tracked revision in the callback and increment it
from an event handler. Include that revision in the snapshot when refresh should
start from the beginning. Recreate a keyed owner when you need a completely fresh
source and boundary. `@catch(error, reset)` recreates sources inside the failed
branch; resetting a consumer's boundary does not refetch an ancestor-owned source.

## Readiness and completion

`getTrackedStatus(value)` accepts a tracked or derived handle and returns a
reactive, non-suspending status:

| Current work                                                  | `state`     | `complete` |
| ------------------------------------------------------------- | ----------- | ---------- |
| No result yet                                                 | `'pending'` | `false`    |
| Stream has yielded, including waiting or same-source recovery | `'ready'`   | `false`    |
| Promise resolved or iterator naturally completed              | `'ready'`   | `true`     |
| Terminal source failure                                       | `'error'`   | `false`    |
| Ordinary synchronous tracked value                            | `'ready'`   | `true`     |

Read the status in a template expression, effect, or derived calculation to follow
updates. Saving the returned object once in component setup captures a snapshot.
Use `state === 'ready'` to guard value access; inspecting status does not suppress
the normal error-boundary behavior of a value read.

For a derived value, readiness describes whether its computation can produce a
value. Completion includes only its current dependencies. Switching a conditional
dependency drops the old dependency's status. A derived that handles a pending
input can produce a ready fallback while remaining incomplete.

Natural completion notifies status readers even when no final value is emitted.
It does not fabricate another data value or put ready readers back into suspense.
`complete: false` is not a connection-health signal or a guarantee of another
yield; `complete: true` describes current work, not a value that can never change.

### Migrating from trackPending

`trackPending` has been removed. Replace loading checks with
`getTrackedStatus(source).state === 'pending'`. Replace safe-access guards such as
`!trackPending(source)` with `getTrackedStatus(source).state === 'ready'`.
`state !== 'pending'` also includes errors, so it is not a safe-access guard.

The status getter has no callback overload. For a calculation, create a named
derived and inspect that handle inside a reactive consumer:

```ts
const total = track(() => first.value + second.value);
const loading = track(() => getTrackedStatus(total).state === 'pending');
```

## SSR and continuation

SSR consumes an iterable to its first accepted value, renders the corresponding
HTML, CSS, and head content, and serializes that snapshot with continuation
metadata. It then closes the producer **without pulling ahead** to check for
another value. This applies to finite and indefinite sources, buffered rendering,
streaming SSR, and prerendering. This handoff is automatic.

When the browser activates the owner, it adopts the snapshot and re-enters
`compute(previous)`. In the row example, SSR renders cursor 100; the browser calls
`readRows(100)` and can accumulate through cursor 300. Resuming at 300 discovers
completion without another yield. A single-yield server iterator still needs
continuation because SSR has not observed its next `done` result. Resolved promises
are already complete and need no continuation request.

Callbacks must be safe to restart with a cursor or a fresh authoritative snapshot.
Ripple cannot restore a generator stack, preserve arbitrary side effects across
requests, or make an upstream source resumable. No sticky routing or server-held
iterator registry is required. Hydration-disabled output keeps the initial
snapshot without later updates.

Subsequent RPC yields carry data, which updates existing reactive consumers. They
add no per-yield scripts, hydration markers, or template placeholders and do not
rehydrate the boundary. See [streaming SSR](./application#streaming-ssr) for delivery
of the initial pending and ready HTML.

### Recovery and cancellation

Iterable server functions use an incremental fetch response through Ripple's RPC
endpoint and the configured [custom serializers](./application#custom-serialization).
Explicit completion ends the source. EOF without completion is an interruption.
RPC frames are capped at 8 MiB; use bounded batches or snapshots.

A restartable iterable read owner can retry recognized transport interruptions up
to three times with bounded backoff. It retains its accepted value and calls the
callback again to construct fresh arguments. Exhausted retries, application
errors, invalid frames, and permanent rejections reach the usual error path.
Ordinary promise or mutation RPCs are not automatically retried. Direct external
APIs need their own transport/retry integration.

Disposal and dependency changes cancel owned RPC work and pending retries. For
other cooperative sources, return `{ promise, abortController }` and use that
controller's signal in the operation. Closing a generator cannot forcibly stop
arbitrary work that ignores cancellation.

## Deferred hydration

A source created **inside** `Hydrate` does not initialize or open a continuation
request before the gate activates. Incompleteness never overrides the selected
strategy. `never()` and removal before activation start no component-owned request.
The source must handle delayed or expired cursors by resnapshotting or reporting
an error.

To receive updates before a deferred view initializes, create the source in an
active ancestor and pass its handle through props or Context. For example, given
an application-provided resumable `watchCount(previous)` source:

```tsrx
import { Hydrate, trackAsync, type Tracked } from 'ripple';
import { visible } from 'ripple/hydration';
import { watchCount } from './count-source';

function CountView({ count }: { count: Tracked<number> }) {
  return <p>{count.value}</p>;
}

export function Dashboard() @{
  const count = trackAsync<number>((previous) => watchCount(previous));
  <Hydrate when={visible()}>
    <CountView {count} />
  </Hydrate>
}
```

This source starts when `Dashboard` activates. `CountView` later reuses that owner
and its reader. Ripple adopts the historical HTML and status before reconciling
current values, preserving unaffected DOM and early native form edits. A status
getter cannot inspect a source that has not yet been created inside an
uninitialized child.

## Hosting

Builds with server functions emit `dist/server/rpc.js`, whose
`createHandler(runtime)` factory creates an independent Web Request/Response
handler. It loads the addressed server-function graph and required serializers,
without importing unrelated pages, layouts, or the document renderer.

The standard Node and Bun server entries already support streaming RPC. To isolate
loaded RPC code too, serve the RPC entry in a separate process and route
`/_$_ripple_rpc_$_/*` to it. Vercel's adapter creates and routes to a separate
streaming function automatically. Worker integrations can instantiate the RPC
entry using their adapter runtime.

Host duration, CPU, and connection limits still apply. Ending the document response
releases its rendering state; the continuing RPC request still owns resources.
Using a shared process does not unload previously evaluated SSR modules.
