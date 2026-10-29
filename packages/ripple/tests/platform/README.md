# Async iterable delivery validation

These checks cover issue #1614 without deploying to a hosted account.

```sh
pnpm --filter ripple exec node tests/browser/async-iterable.mjs
pnpm --filter ripple exec node tests/browser/hydrate.js
pnpm --filter ripple exec node --expose-gc tests/platform/async-iterable-bench.mjs /path/to/baseline-checkout
RIPPLE_MINIFLARE=/path/to/miniflare/dist/src/index.js pnpm --filter ripple exec node tests/platform/async-iterable.mjs
```

The baseline checkout needs its package dependencies available. The worker harness
uses an independently installed Miniflare/workerd; it adds no workspace
dependency. The recorded run used Node 24.18.0 and Miniflare 4.20260730.0/workerd
1.20260730.1.

## Coverage

- The Chromium harness serves production-built code through the Node adapter. SSR
  supplies rows 1–100. A deferred owner starts no request until activation. The
  harness waits until the browser accepts cursor 300 before terminating the
  response, then verifies a new request with arguments `[300]`, rows through 400,
  explicit completion, unchanged existing row/input nodes and preserved early
  edits. No per-yield scripts or templates are inserted. The initial request sends
  `[100]`; accumulated rows never appear in RPC arguments.
- The workerd harness destroys the document worker before continuation, terminates
  an RPC invocation during iteration, and resumes in another worker. It checks
  first-ready HTML, CSS/head, no lookahead, delayed activation, empty resumed
  completion, expired-cursor errors, and renderer-free RPC evaluation. A shared
  entry comparison confirms that evaluated renderer code stays loaded in a reused
  instance even after the document response finishes.
- `packages/vite-plugin/tests/transport.test.js` builds actual isolated function
  artifacts and calls them in fresh Node processes at cursors 0/100/300/999. A
  mixed component module has an observable SSR-only side effect: RPC imports and
  requests must not evaluate it. This also checks custom transport registration.
  The Vercel adapter tests verify separate tracing, routing and streaming function
  configuration, with document ISR excluded from RPC.
- Client/server/hydration suites cover local and promised iterables, accepted
  `undefined`, empty sources, repeated values, completion-only notifications,
  current derived dependencies, replacement queries, cancellation, bounded
  retries, failed mutation isolation, catch reset, display overrides, deferred
  ownership, shared sources, historical status and early binding writes.
- Protocol tests exercise partial UTF-8/frames, backpressure, completion, terminal
  application errors, interrupted EOF, duplicate/invalid frames and abort during a
  blocked `next()`.

Several TSRX fixture loops have `prettier-ignore`: the currently published TSRX
formatter otherwise removes `await` from `for await`. The shared formatter remains
in its owning TSRX repository.

## Measurements on 29 October 2026

These are local diagnostic samples, not performance budgets or hosted cold-start
claims. The benchmark compares a single streaming document response awaiting three
batches with first-ready handoff plus a continuation request. Each batch waits 2
ms; throughput uses a separate zero-delay run (50 warmups, 500 buffered renders).
Total in-process delivery includes framing and decoding, but excludes network RTT
and HTTP headers. Worker cold timings include local worker startup. Heap deltas
include measurement bookkeeping and GC noise; weak reachability is the retention
check.

| Small streaming fixture                     | Single response | First-ready handoff |
| ------------------------------------------- | --------------: | ------------------: |
| Time to ready content                       |        11.72 ms |             3.73 ms |
| Total delivery                              |        11.74 ms |            16.33 ms |
| Response body bytes, including continuation |           4,916 |               4,998 |
| Source setups                               |               1 |                   2 |
| HTML comment markers                        |               6 |                   6 |
| Buffered SSR renders/second                 |          23,642 |              15,144 |
| In-process CPU                              |        26.44 ms |            11.82 ms |
| Heap delta after collection                 |      -623,368 B |          -118,872 B |
| Reachable SSR trees while RPC is open       |               0 |                   0 |
| Active producers while RPC is open          |               0 |                   1 |
| Active producers after reader cleanup       |               0 |                   0 |

The retention probe holds weak references to actual SSR blocks and producer state,
then takes a heap snapshot to complete collection. Snapshot files are temporary
and removed by the harness. Continuing RPC still owns producer state; ending the
HTML response does not eliminate that work. The handoff trades earlier usable
content for another request/setup and more total delivery work. This tiny fixture
shows lower buffered throughput for handoff, not a throughput improvement.

Against baseline `1c4b60fc7` with the same production build settings:

| Client fixture    | Baseline entry gzip | New entry gzip | New total emitted gzip |
| ----------------- | ------------------: | -------------: | ---------------------: |
| Synchronous value |             6,232 B |        6,232 B |                6,232 B |
| Promise value     |             7,944 B |        9,444 B |                9,800 B |

Iteration/recovery is absent from the entry chunk and loads on first iterable use.
The general async/hydration support adds 1,500 compressed bytes to this promise
entry. The unused lazy chunk is emitted but not fetched by a promise-only run.
Status notification signals allocate only when inspected. SSR continuation adds
one compact `c` field to the existing snapshot, with no additional marker or
placeholder nodes.

The 400-row browser case used 4,013 HTML bytes plus 6,123 RPC body bytes across
requests `[100]` and `[300]`. Its total emitted client JavaScript compressed to
about 22 KB gzip. Existing rows were reused; each new batch added only its new
rows.

The worker fixture emitted 15,763 B for isolated RPC, 26,756 B for SSR, and 35,766
B for a shared entry. Local isolated RPC cold-first/warm-complete times were
106.51/4.81 ms; shared cold/warm RPC times were 96.50/2.49 ms. Recovery into a
fresh worker, including the source's 100 ms completion delay, took 201.32 ms.
Those samples do not demonstrate a cold-start speedup: the verified benefit is
separating the evaluated graphs and request lifetimes. Actual hosting duration/CPU
limits and network costs still need to be included in application-specific
measurements.
