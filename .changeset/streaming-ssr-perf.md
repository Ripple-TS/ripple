---
'ripple': patch
---

Faster streaming SSR. A resolved `trackAsync` value made of plain data (strings, finite numbers, booleans, `null`, arrays and plain objects, each reachable once) now travels in its hydration script as raw JSON that `JSON.parse` of the envelope yields directly, instead of a devalue-encoded string; values JSON cannot represent (`undefined`, `NaN`, `-0`, bigints, Dates, Maps, Sets, shared references, cycles) keep the devalue encoding, and the client reads either form. Boundaries that settle in the same task (data arriving together, a batch of promises resolved by one timer or I/O callback) stream as one chunk, flushed once the task's microtasks have drained; closing the stream flushes whatever is still queued first. `devalue` is updated to 5.9.2, with the stringify performance patch proposed upstream in sveltejs/devalue#190 applied through pnpm's `patchedDependencies` until it is released.
