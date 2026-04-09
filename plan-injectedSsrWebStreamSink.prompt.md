## Plan: Injected SSR Web Stream Sink

Implement only a minimal runtime-level Web Stream sink API for SSR. The server owns stream creation and HTTP response creation. The SSR runtime only writes HTML into an injected sink. Do not redesign adapters, do not make render create or return the public stream, and do not broaden scope beyond replacing the current Node Readable usage behind Output.#stream.

**Steps**
1. Define the exact streaming boundary.
Server responsibility: create the Web Stream pair, keep the public ReadableStream, pass only the sink into render, and build the HTTP Response.
Render/runtime responsibility: write HTML chunks into the sink, close it on success, and error it on failure after streaming has started.

2. Introduce a minimal sink type in the Ripple server runtime.
Required methods:
push(chunk: string): void
close(): void
error(reason: unknown): void
Not included:
no backpressure API, no adapter hooks, no Node stream methods, no Response creation helpers.

3. Add a runtime factory that creates the Web Stream and sink pair.
Location: /Users/leonid/Documents/triplemint/tempcode/ripple/packages/ripple/src/runtime/internal/server/index.js or a small sibling helper imported from there.
Required output shape:
{ stream, sink }
Where:
stream is ReadableStream<Uint8Array>
sink is the minimal push/close/error object consumed by Output.
Implementation details:
use TextEncoder to encode pushed HTML strings into Uint8Array chunks, enqueue through the Web Streams controller, map sink.close() to controller.close(), and map sink.error(reason) to controller.error(reason).

4. Replace the current Node-specific Output stream dependency.
In /Users/leonid/Documents/triplemint/tempcode/ripple/packages/ripple/src/runtime/internal/server/index.js:
change Output.#stream from the current Node-oriented SSRStream object to the new injected sink type; change _setStream() to accept the sink type; change Output.push() so async-phase streaming writes call sink.push(str); remove reliance on .push(null) and .emit('error', ...) semantics.

5. Change render options to accept an injected sink, not a boolean flag.
Current behavior to remove:
options.stream === true causing render() to import Node stream.Readable and create a stream internally.
New behavior:
options.stream is the injected sink object.
If options.stream is absent:
keep current buffered SSR behavior.
If options.stream is present:
render() writes into that sink and resolves when finished.

6. Keep render ownership narrow and explicit.
In streaming mode, render must not:
create the public Web Stream, return the public Web Stream, create a Response, know anything about HTTP headers, or know anything about adapters.
In streaming mode, render must:
use the provided sink, flush the initial sync HTML into the sink, continue writing async HTML into the sink, call sink.close() when rendering fully completes, and call sink.error(error) if an error occurs after streaming has started.

7. Keep buffered SSR behavior unchanged.
When no sink is provided, render should continue to return the existing buffered SSR result:
{ head, body, css }
Do not change the buffered return shape in this task.
Do not change existing non-streaming SSR consumers in this task.

8. Export the stream factory from the public server entry.
In /Users/leonid/Documents/triplemint/tempcode/ripple/packages/ripple/src/server/index.js:
export the new factory so server code can import it from ripple/server. This export should only expose stream creation primitives, not Response creation.

9. Update public server types.
In /Users/leonid/Documents/triplemint/tempcode/ripple/packages/ripple/types/server.d.ts:
add a public type for the Web Stream, ReadableStream<Uint8Array>; add a separate public type for the injected sink accepted by render; update SSRRenderOptions so stream means the sink object, not a boolean; update the render return type so it remains buffered-result-oriented unless a separate streaming overload is needed.

10. Rewrite the streaming test to match the new contract.
In /Users/leonid/Documents/triplemint/tempcode/ripple/packages/ripple/tests/server/streaming-ssr.test.ripple:
replace the disabled Node-event-stream assumptions.
New test pattern:
create { stream, sink }, call await render(Component, { stream: sink }), read the public stream using Web Stream APIs or new Response(stream).text(), and assert the resulting HTML.

11. Verify adapter changes are out of scope unless proven necessary.
Expected outcome:
no adapter package changes.
Reason:
servers can already return new Response(stream, headers) and adapter-node already bridges Response.body. Only if verification fails on a concrete platform should adapter changes be proposed later.

**Relevant files**
- /Users/leonid/Documents/triplemint/tempcode/ripple/packages/ripple/src/runtime/internal/server/index.js — main implementation site for sink type, stream factory or factory integration, Output.#stream changes, and render changes.
- /Users/leonid/Documents/triplemint/tempcode/ripple/packages/ripple/src/server/index.js — public export for the stream factory.
- /Users/leonid/Documents/triplemint/tempcode/ripple/packages/ripple/types/server.d.ts — public types for the Web Stream, sink, and render options.
- /Users/leonid/Documents/triplemint/tempcode/ripple/packages/ripple/tests/server/streaming-ssr.test.ripple — rewrite tests to use the new injected sink contract.
- /Users/leonid/Documents/triplemint/tempcode/ripple/packages/adapter-node/src/index.js — verification-only reference; not planned to change.

**Verification**
1. Prove the stream factory returns a ReadableStream<Uint8Array> plus sink pair.
2. Prove render(Component, { stream: sink }) writes valid SSR HTML into that stream.
3. Prove successful streaming closes the sink.
4. Prove late streaming errors call sink.error(reason).
5. Prove buffered SSR without options.stream remains unchanged.
6. Prove the stream can be used by server code as:
create { stream, sink }, await render(Component, { stream: sink }), return new Response(stream, { headers: { 'content-type': 'text/html; charset=utf-8' } }).

**Explicitly Included**
- A runtime helper that creates a Web Stream and sink pair.
- Changing Output to depend on the injected sink instead of Node Readable.
- Changing render options so streaming uses an injected sink.
- Public server exports and typings for that API.
- Streaming tests updated to Web Streams.

**Explicitly Not Included**
- Any adapter-owned stream factory.
- Any code where render creates the public stream.
- Any code where render returns the public stream.
- Any code where render creates or returns a Response.
- Any HTTP header logic inside render.
- Any Node-specific Readable APIs in the runtime streaming path.
- Any broad SSR protocol redesign.
- Any async CSS streaming redesign beyond preserving current behavior.
- Any Vite plugin integration changes.
- Any consumer migration beyond tests and required public exports/types.

**Decisions**
- The server owns stream and Response.
- The runtime owns sink writes only.
- options.stream means sink object, not boolean.
- The public browser-facing stream type is ReadableStream<Uint8Array>.
- The first cut is intentionally minimal and should only replace the current Node Readable dependency used by Output.#stream.

**Further Considerations**
1. Recommended naming: create_ssr_stream() if you want the helper to stay obviously SSR-specific.
2. Recommended implementation shape: keep the sink type tiny and avoid exposing the stream controller itself.
3. Recommended discipline: if a follow-up touches adapters, CSS streaming, or streaming protocol semantics, treat it as a separate task.