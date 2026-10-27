import { render, createStream, getCss } from 'ripple/server';
import {
	createRequestHandler as coreRequestHandler,
	createSsrStreamResponse,
	getSsrStatus,
	transformHtmlStringWithRouter,
	transformReadableStreamWithRouter,
} from '@tanstack/router-core/ssr/server';
import { routerComponent } from './Root.tsrx';
import { escapeAttribute, renderAsset } from '../assets.js';
import { observeDeferred } from './deferred.js';

/** @import { AnyRouter } from '@tanstack/router-core' */
/** @import { RenderRouterOptions, RequestHandlerOptions } from '../../types/ssr/server.js' */

const usedRouters = new WeakSet();

/** Each invocation must construct a new router, including during concurrent requests.
 * @template {AnyRouter} TRouter
 * @param {RequestHandlerOptions<TRouter>} options
 */
export function createRequestHandler(options) {
	return coreRequestHandler({
		...options,
		createRouter: () => {
			const router = options.createRouter();
			if (usedRouters.has(router))
				throw new Error('SSR requires a fresh router for every request.');
			usedRouters.add(router);
			router.update({ isServer: true });
			return router;
		},
	});
}

/** @param {AnyRouter} router */
function initialScripts(router) {
	const tags = router.serverSsr?.takeInitialHydrationScriptTags();
	if (!tags) throw new Error('Use createRequestHandler to prepare the router before rendering.');
	return {
		before:
			tags.before.map((tag) => renderAsset(tag)).join('') +
			renderAsset({
				tag: 'script',
				attrs: { nonce: router.options.ssr?.nonce },
				children: `(${observeDeferred.toString()})(self.$_TSR?.router);document.currentScript.remove()`,
			}),
		boundary: renderAsset(tags.boundary),
	};
}

/** @param {RenderRouterOptions} options */
export async function renderRouterToString({
	router,
	request,
	responseHeaders = new Headers(),
	children = routerComponent(router),
}) {
	try {
		request.signal.throwIfAborted();
		const scripts = initialScripts(router);
		const nonce = router.options.ssr?.nonce;
		const result = await render(children, { signal: request.signal, nonce });
		if (result.topLevelError) throw result.topLevelError;
		const css = getCss(result.css);
		const nonceAttribute = nonce === undefined ? '' : ` nonce="${escapeAttribute(nonce)}"`;
		const styles = css ? `<style data-ripple-ssr${nonceAttribute}>${css}</style>` : '';
		const html = `<html><head>${scripts.before}${result.head}${styles}</head><body><div id="app">${result.body}</div>${scripts.boundary}</body></html>`;
		return new Response(
			await transformHtmlStringWithRouter(router, html, { signal: request.signal }),
			{
				status: getSsrStatus(router),
				headers: responseHeaders,
			},
		);
	} catch (error) {
		request.signal.throwIfAborted();
		console.error('Render to string error:', error);
		return new Response('Internal Server Error', { status: 500, headers: responseHeaders });
	} finally {
		router.serverSsr?.cleanup();
	}
}

/** The renderer emits complete HTML records; the core transform owns state serialization.
 * @param {RenderRouterOptions} options
 */
export async function renderRouterToStream({
	router,
	request,
	responseHeaders = new Headers(),
	children = routerComponent(router),
}) {
	const controller = new AbortController();
	try {
		request.signal.throwIfAborted();
		const scripts = initialScripts(router);
		const { stream, sink } = createStream();
		const responseStream = transformReadableStreamWithRouter(router, stream, {
			rendererSafePoint: 'record-end',
			signal: request.signal,
			onAbort: (reason) => controller.abort(reason),
		});
		let shell = true;
		const rendering = render(children, {
			nonce: router.options.ssr?.nonce,
			signal: controller.signal,
			closeStream: false,
			streamTemplate: {
				before: `<!DOCTYPE html><html><head>${scripts.before}`,
				between: '</head><body><div id="app">',
				after: '',
			},
			stream: {
				push(chunk) {
					if (controller.signal.aborted) return;
					sink.push(shell ? `${chunk}</div>${scripts.boundary}` : chunk);
					shell = false;
				},
				close() {
					if (!controller.signal.aborted) sink.close();
				},
				error(error) {
					if (!controller.signal.aborted) sink.error(error);
				},
			},
		});
		void rendering
			.then((result) => {
				if (controller.signal.aborted) return;
				if (result.topLevelError) sink.error(result.topLevelError);
				else {
					sink.push('</body></html>');
					sink.close();
				}
			})
			.catch((error) => {
				if (!controller.signal.aborted) sink.error(error);
			});
		controller.signal.throwIfAborted();
		return createSsrStreamResponse(
			router,
			new Response(responseStream, {
				status: getSsrStatus(router),
				headers: responseHeaders,
			}),
		);
	} catch (error) {
		controller.abort(error);
		router.serverSsr?.cleanup();
		throw error;
	}
}

export const defaultRenderHandler = renderRouterToString;
export const defaultStreamHandler = renderRouterToStream;
