import { describe, it, expect } from 'vitest';
import { buildStreamTemplate, createStreamingResponse } from '../src/server/stream-response.js';

describe('buildStreamTemplate', () => {
	const template =
		'<html><head><!--ssr-head--></head><body><div id="root"><!--ssr-body--></div><script src="/x.js"></script></body></html>';

	it('splits the template around the ssr markers and injects head content', () => {
		const result = buildStreamTemplate(template, '<meta name="x">');
		expect(result).toEqual({
			before: '<html><head><meta name="x">',
			between: '</head><body><div id="root">',
			after: '</div><script src="/x.js"></script></body></html>',
		});
	});

	it('returns null when a marker is missing', () => {
		expect(buildStreamTemplate('<html><body><!--ssr-body--></body></html>', '')).toBeNull();
		expect(buildStreamTemplate('<html><head><!--ssr-head--></head></html>', '')).toBeNull();
	});

	it('returns null when the markers are out of order', () => {
		expect(buildStreamTemplate('<!--ssr-body--><!--ssr-head-->', '')).toBeNull();
	});
});

describe('createStreamingResponse', () => {
	it('returns an HTML response immediately and streams render output', async () => {
		/** @type {string[]} */
		const pushed = [];
		let closed = false;

		const fakeSink = {
			push: (/** @type {string} */ chunk) => pushed.push(chunk),
			close: () => {
				closed = true;
			},
			error: () => {},
		};
		const fakeStream = new ReadableStream({
			start(controller) {
				controller.enqueue(new TextEncoder().encode('streamed'));
				controller.close();
			},
		});

		const streamTemplate = { before: '<b>', between: '<m>', after: '<a>' };
		/** @type {any} */
		let seen_options;

		const response = createStreamingResponse({
			render: (/** @type {Function} */ _component, /** @type {any} */ options) => {
				seen_options = options;
				options.stream.push('shell');
				options.stream.close();
				return Promise.resolve({ stream: options.stream });
			},
			createSsrStream: () => ({ stream: fakeStream, sink: fakeSink }),
			component: () => {},
			rootBoundary: undefined,
			streamTemplate,
		});

		expect(response).toBeInstanceOf(Response);
		expect(response.headers.get('Content-Type')).toBe('text/html; charset=utf-8');
		expect(seen_options.streamTemplate).toBe(streamTemplate);
		expect(pushed).toEqual(['shell']);
		expect(closed).toBe(true);
		expect(await response.text()).toBe('streamed');
	});

	it('propagates render failures to the sink', async () => {
		/** @type {unknown} */
		let errored = null;
		const response = createStreamingResponse({
			render: () => Promise.reject(new Error('render exploded')),
			createSsrStream: () => ({
				stream: new ReadableStream(),
				sink: {
					push: () => {},
					close: () => {},
					error: (/** @type {unknown} */ reason) => {
						errored = reason;
					},
				},
			}),
			component: () => {},
			rootBoundary: undefined,
			streamTemplate: { before: '', between: '', after: '' },
		});

		expect(response).toBeInstanceOf(Response);
		await new Promise((resolve) => setTimeout(resolve, 0));
		expect(errored).toBeInstanceOf(Error);
	});
});
