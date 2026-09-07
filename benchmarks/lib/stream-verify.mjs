// Shared correctness gate for the streaming-SSR suites (streaming-ssr,
// ssr-http). Both render the same product page — a synchronous shell with one
// `.masthead` plus N Suspense-boundary `<article>` cards — and must prove the
// stream carried the whole page and (for the staggered schedule) genuinely
// streamed rather than buffering to all-ready.

export const countMatches = (s, re) => (s.match(re) || []).length;

// Octane's stream protocol stores resolved boundary markup in a JSON data
// script, with `<` escaped, so trusted raw HTML cannot close the transport
// carrier early. Reconstruct those payloads for semantic verification only;
// measured chunks, byte counts and timings continue to use the original wire
// output. Other targets have no matching carrier and pass through unchanged.
export const OCTANE_JSON_CARRIER_RE =
	/<script\b(?=[^>]*\btype="application\/json")(?=[^>]*\bdata-octane-stream(?:\s|>))[^>]*>([\s\S]*?)<\/script>/g;

export function semanticHtmlForVerification(target, html) {
	return html.replace(OCTANE_JSON_CARRIER_RE, (_carrier, payload) => {
		let decoded;
		try {
			decoded = JSON.parse(payload);
		} catch (error) {
			throw new Error(`${target}: invalid Octane JSON stream carrier`, { cause: error });
		}
		if (typeof decoded !== 'string') {
			throw new Error(`${target}: Octane JSON stream carrier did not contain HTML`);
		}
		return decoded;
	});
}

// Correctness gate (throws on failure). It asserts SEMANTICS — the stream must
// carry the whole page (shell exactly once, all card payloads) and, for the
// staggered schedule, must genuinely have streamed (first chunk out before the
// slowest data could have resolved). It deliberately does NOT assert chunk
// granularity: how a framework frames its output (React splits the shell
// across view-buffer writes, Solid inlines boundaries that resolve before its
// first flush, octane batches a whole round into one segment chunk) is itself
// a measured result, reported via chunkCount / skeletonsInStream.
export function verifyStream(target, scenario, r, cardCount) {
	const tag = `${target}/${scenario}`;
	if (countMatches(r.html, /class="masthead"/g) !== 1)
		throw new Error(`${tag}: expected exactly one shell masthead`);
	const semanticHtml = semanticHtmlForVerification(target, r.html);
	const articles = countMatches(semanticHtml, /<article[\s>]/g);
	if (articles !== cardCount)
		throw new Error(`${tag}: expected ${cardCount} <article> cards, got ${articles}`);
	for (let i = 0; i < cardCount; i++) {
		if (!semanticHtml.includes(`Card ${i} — `))
			throw new Error(`${tag}: card ${i} payload missing from stream`);
	}
	if (!r.firstChunk.includes('class="masthead"'))
		throw new Error(`${tag}: first chunk lacks the shell`);
	if (scenario === 'staggered') {
		// The slowest card resolves at 50ms; a first chunk carrying its payload
		// means the renderer buffered the page instead of streaming the shell.
		if (r.firstChunk.includes(`Card ${cardCount - 1} — `))
			throw new Error(`${tag}: slowest card's payload in the first chunk — buffered, not streamed`);
		if (r.total < 40)
			throw new Error(
				`${tag}: stream ended at ${r.total.toFixed(1)}ms — before the 50ms data schedule`,
			);
	}
	return { skeletonsInStream: countMatches(r.html, /class="skeleton"/g) };
}
