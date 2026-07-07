/**
 * Shared helpers for streaming SSR responses, used by both the dev server
 * (render-route.js) and the production runtime (production.js).
 *
 * Platform-agnostic: relies only on the Web `Response`/`ReadableStream`
 * globals and the `render`/`create_ssr_stream` functions injected by the
 * caller.
 */

const SSR_HEAD_MARKER = '<!--ssr-head-->';
const SSR_BODY_MARKER = '<!--ssr-body-->';

/**
 * Splits an HTML document template into the streaming scaffold around the
 * `<!--ssr-head-->` and `<!--ssr-body-->` markers. The renderer emits
 * `before` + SSR head content + `between` + shell body, streams boundary
 * chunks, and pushes `after` when the stream closes.
 *
 * @param {string} template - full HTML document template
 * @param {string} headContent - static per-request head additions (route
 *   data script, preload tags); SSR-derived head content and CSS come from
 *   the stream itself
 * @returns {{ before: string, between: string, after: string } | null}
 *   null when the template is missing the markers (caller should fall back
 *   to buffered rendering)
 */
export function buildStreamTemplate(template, headContent) {
	const head_index = template.indexOf(SSR_HEAD_MARKER);
	const body_index = template.indexOf(SSR_BODY_MARKER);
	if (head_index === -1 || body_index === -1 || body_index < head_index) {
		return null;
	}
	return {
		before: template.slice(0, head_index) + headContent,
		between: template.slice(head_index + SSR_HEAD_MARKER.length, body_index),
		after: template.slice(body_index + SSR_BODY_MARKER.length),
	};
}

/**
 * Kicks off a streaming render and returns the HTML Response immediately —
 * the shell is flushed synchronously by the renderer and boundary chunks
 * follow as their async work settles.
 *
 * @param {{
 *   render: Function,
 *   createSsrStream: () => { stream: ReadableStream<Uint8Array>, sink: { push(chunk: string): void, close(): void, error(reason: unknown): void } },
 *   component: Function,
 *   rootBoundary: object | undefined,
 *   streamTemplate: { before: string, between: string, after: string },
 * }} options
 * @returns {Response}
 */
export function createStreamingResponse({
	render,
	createSsrStream,
	component,
	rootBoundary,
	streamTemplate,
}) {
	const { stream, sink } = createSsrStream();

	Promise.resolve(
		render(component, {
			stream: sink,
			rootBoundary,
			streamTemplate,
		}),
	).catch((/** @type {unknown} */ error) => {
		console.error('[ripple] SSR streaming error:', error);
		sink.error(error);
	});

	return new Response(stream, {
		status: 200,
		headers: { 'Content-Type': 'text/html; charset=utf-8' },
	});
}
