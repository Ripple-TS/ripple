import { create_ssr_stream } from 'ripple/server';
import { trackAsync } from 'ripple';

interface Deferred<T> {
	promise: Promise<T>;
	resolve: (value: T) => void;
	reject: (reason?: unknown) => void;
}

function deferred<T>(): Deferred<T> {
	let resolve: (value: T) => void = () => {};
	let reject: (reason?: unknown) => void = () => {};
	const promise = new Promise<T>((res, rej) => {
		resolve = res;
		reject = rej;
	});
	return { promise, resolve, reject };
}

function recordingSink() {
	const chunks: string[] = [];
	let closed = false;
	return {
		chunks,
		isClosed: () => closed,
		sink: {
			push(chunk: string) {
				chunks.push(chunk);
			},
			close() {
				closed = true;
			},
			error(_reason: unknown) {},
		},
	};
}

const SLOT_OPEN_RE = /<!--\[\?(\d+)-->/;

/**
 * Applies streamed chunks the way the inline swap runtime would: collects
 * chunk templates, then repeatedly replaces `<!--[?N-->…<!--]-->` slots
 * (depth-aware over `[`-prefixed / `]` comments) with the template content.
 */
function applyStream(chunks: string[]): string {
	let html = chunks.join('');
	const templates = new Map<string, string>();
	html = html.replace(
		/<template data-ripple-chunk="(\d+)">([\s\S]*?)<\/template>/g,
		(_m, id, content) => {
			templates.set(id, content);
			return '';
		},
	);
	html = html.replace(/<script>__RIPPLE_S__\((\d+)(,1)?\)<\/script>/g, '');
	// the inline swap runtime (serialized function, minified or not)
	html = html.replace(/<script>\(function[\s\S]*?<\/script>/g, '');

	let match: RegExpMatchArray | null;
	while (match = html.match(SLOT_OPEN_RE)) {
		const id = match[1];
		const content = templates.get(id);
		if (content === undefined) {
			throw new Error(`no chunk streamed for slot ${id}`);
		}
		const start = match.index!;
		const comment_re = /<!--([^>]*?)-->/g;
		comment_re.lastIndex = start + match[0].length;
		let depth = 0;
		let end = -1;
		let end_len = 0;
		let m: RegExpExecArray | null;
		while (m = comment_re.exec(html)) {
			const data = m[1];
			if (data === ']') {
				if (depth === 0) {
					end = m.index;
					end_len = m[0].length;
					break;
				}
				depth--;
			} else if (data.startsWith('[')) {
				depth++;
			}
		}
		if (end === -1) {
			throw new Error(`unterminated slot ${id}`);
		}
		html = html.slice(0, start) + content + html.slice(end + end_len);
	}
	return html;
}

function normalize(html: string): string {
	return html.replace(
		/<script id="__ripple_ta_[^"]+" type="application\/json">[\s\S]*?<\/script>/g,
		'',
	).replace(/<style data-ripple-ssr>[\s\S]*?<\/style>/g, '');
}

describe('create_ssr_stream', () => {
	it('renders SSR HTML into the injected sink and exposes a web stream', async () => {
		function App() @{
			<div>{'Hello, streaming SSR!'}</div>
		}

		const { stream, sink } = create_ssr_stream();

		expect(stream).toBeInstanceOf(ReadableStream);
		await render(App, { stream: sink });

		const html = await new Response(stream).text();
		expect(html).toBeHtml('<div>Hello, streaming SSR!</div>');
	});

	it('closes the public stream when streaming finishes successfully', async () => {
		function App() @{
			<p>{'stream closed'}</p>
		}

		const { stream, sink } = create_ssr_stream();
		const reader = stream.getReader();
		const decoder = new TextDecoder();
		let html = '';

		await render(App, { stream: sink });

		while (true) {
			const { done, value } = await reader.read();
			if (done) {
				break;
			}
			html += decoder.decode(value, { stream: true });
		}

		html += decoder.decode();
		expect(html).toBeHtml('<p>stream closed</p>');

		const terminal_read = await reader.read();
		expect(terminal_read.done).toBe(true);
	});

	it('does not emit the swap runtime for fully synchronous output', async () => {
		function App() @{
			<div>{'all sync'}</div>
		}

		const { chunks, sink, isClosed } = recordingSink();
		await render(App, { stream: sink });

		expect(chunks).toHaveLength(1);
		expect(chunks[0]).not.toContain('__RIPPLE_S__');
		expect(chunks[0]).not.toContain('[?');
		expect(isClosed()).toBe(true);
	});
});

describe('streaming try/pending boundaries', () => {
	it('streams the shell with the fallback, then the settled body as a framed chunk', async () => {
		const d = deferred<string>();

		function Content() @{
			let &[data] = trackAsync(() => d.promise);
			<p>{data}</p>
		}

		function App() @{
			<>
				<h1>{'shell'}</h1>
				@try {
					<>
						<Content />
						<footer>{'static-after'}</footer>
					</>
				} @pending {
					<p class="loading">{'loading...'}</p>
				}
			</>
		}

		const { chunks, sink, isClosed } = recordingSink();
		const result = render(App, { stream: sink });

		// the shell is flushed synchronously, before any async work settles
		expect(chunks).toHaveLength(1);
		const shell = chunks[0];
		expect(shell).toContain('<h1>shell</h1>');
		expect(shell).toContain('<p class="loading">loading...</p>');
		expect(shell).toMatch(SLOT_OPEN_RE);
		// the swap runtime ships with the shell when open slots remain
		expect(shell).toContain('__RIPPLE_S__');
		// nothing of the real body may leak into the shell
		expect(shell).not.toContain('static-after');

		d.resolve('async-data');
		await result;

		expect(isClosed()).toBe(true);
		expect(chunks).toHaveLength(2);

		const slot_match = shell.match(SLOT_OPEN_RE);
		expect(slot_match).not.toBeNull();
		const id = slot_match![1];
		const chunk = chunks[1];
		expect(chunk).toContain(`<template data-ripple-chunk="${id}">`);
		expect(chunk).toContain('<p>async-data</p>');
		// static markup after the suspension point belongs to the chunk
		// (regression: it used to be lost when the boundary cleared its buffer)
		expect(chunk).toContain('<footer>static-after</footer>');
		expect(chunk).toContain(`<script>__RIPPLE_S__(${id})</script>`);
		// the trackAsync envelope ships in the same chunk, ahead of the template
		expect(chunk).toMatch(
			/<script id="__ripple_ta_[^"]+" type="application\/json">[\s\S]*?<\/script>[\s\S]*<template data-ripple-chunk/,
		);
	});

	it('emits an empty slot for a catch-only boundary with an async body', async () => {
		const d = deferred<string>();

		function Content() @{
			let &[data] = trackAsync(() => d.promise);
			<p>{data}</p>
		}

		function App() @{
			@try {
				<Content />
			} @catch (e) {
				<em>{'failed'}</em>
			}
		}

		const { chunks, sink } = recordingSink();
		const result = render(App, { stream: sink });

		expect(chunks).toHaveLength(1);
		// no pending fallback: the slot is an empty comment pair
		expect(chunks[0]).toMatch(/<!--\[\?(\d+)--><!--\]-->/);
		expect(chunks[0]).not.toContain('failed');

		d.resolve('body');
		await result;

		const chunk = chunks[chunks.length - 1];
		expect(chunk).toContain('<p>body</p>');
		expect(chunk).not.toContain('failed');
	});

	it('streams the server-rendered catch into the slot when the async body rejects', async () => {
		const d = deferred<string>();

		function Content() @{
			let &[data] = trackAsync(() => d.promise);
			<p>{data}</p>
		}

		function App() @{
			@try {
				<Content />
			} @pending {
				<p>{'loading...'}</p>
			} @catch (e: Error) {
				<em>{e.message}</em>
			}
		}

		const { chunks, sink } = recordingSink();
		const result = render(App, { stream: sink });

		d.reject(new Error('boom'));
		await result;

		const all = chunks.join('');
		const chunk = chunks[chunks.length - 1];
		expect(chunk).toContain('<em>boom</em>');
		expect(chunk).toContain('<template data-ripple-chunk=');
		// the rejected trackAsync envelope reaches the wire before the chunk
		// that hydrates the catch branch from it
		const envelope_index = all.indexOf('__ripple_ta_');
		const template_index = all.indexOf('<template data-ripple-chunk=');
		expect(envelope_index).toBeGreaterThan(-1);
		expect(envelope_index).toBeLessThan(template_index);
	});

	it('emits a unit error envelope when the catch boundary region is already streamed', async () => {
		const d = deferred<string>();

		function Content() @{
			let &[data] = trackAsync(() => d.promise);
			<p>{data}</p>
		}

		function App() @{
			@try {
				<Content />
			} @pending {
				<p>{'loading...'}</p>
			}
		}

		function RootCatch({ error }: { error: unknown }) @{
			<h2>
				{'root caught: ' + (error instanceof Error ? error.message : String(error))}
			</h2>
		}

		const { chunks, sink } = recordingSink();
		const result = render(App, { stream: sink, rootBoundary: { catch: RootCatch } });

		const shell = chunks[0];
		const slot_match = shell.match(SLOT_OPEN_RE);
		expect(slot_match).not.toBeNull();
		const id = slot_match![1];

		d.reject(new Error('no local catch'));
		const { topLevelError } = await result;

		// the nearest catch boundary is the root, whose region (the shell) is
		// already on the wire — the server cannot re-render it, so it emits a
		// unit error envelope for the client to route into the live boundary
		// during hydration instead
		expect(topLevelError).toBe(null);
		const all = chunks.join('');
		expect(all).not.toContain('root caught');
		expect(all).toContain(`<script id="__ripple_te_${id}" type="application/json">`);
		expect(all).toContain('no local catch');
		expect(all).toContain(`__RIPPLE_S__(${id},1)`);
	});
});

describe('streaming nested and sibling boundaries', () => {
	function makeNestedApp(d_outer: Deferred<string>, d_inner: Deferred<string>) {
		function OuterData() @{
			let &[data] = trackAsync(() => d_outer.promise);
			<p class="outer">{data}</p>
		}

		function InnerData() @{
			let &[data] = trackAsync(() => d_inner.promise);
			<p class="inner">{data}</p>
		}

		function App() @{
			@try {
				<>
					<OuterData />
					@try {
						<InnerData />
					} @pending {
						<p>{'inner-loading'}</p>
					}
				</>
			} @pending {
				<p>{'outer-loading'}</p>
			}
		}

		return App;
	}

	it('coalesces a nested boundary that settles before its parent into one chunk', async () => {
		const d_outer = deferred<string>();
		const d_inner = deferred<string>();
		const App = makeNestedApp(d_outer, d_inner);

		const { chunks, sink } = recordingSink();
		const result = render(App, { stream: sink });

		expect(chunks).toHaveLength(1);
		expect(chunks[0]).toContain('outer-loading');
		expect(chunks[0]).not.toContain('inner-loading');

		d_inner.resolve('inner-done');
		await d_inner.promise;
		await Promise.resolve();
		// the inner boundary settled but its slot never went on the wire —
		// nothing may stream until the parent settles
		expect(chunks).toHaveLength(1);

		d_outer.resolve('outer-done');
		await result;

		expect(chunks).toHaveLength(2);
		const chunk = chunks[1];
		expect(chunk).toContain('<p class="outer">outer-done</p>');
		expect(chunk).toContain('<p class="inner">inner-done</p>');
		// coalesced: the inner boundary is inlined, no open slot, no fallback
		expect(chunk).not.toContain('inner-loading');
		expect(chunk).not.toMatch(SLOT_OPEN_RE);
	});

	it('streams the parent chunk with a nested open slot before the child chunk', async () => {
		const d_outer = deferred<string>();
		const d_inner = deferred<string>();
		const App = makeNestedApp(d_outer, d_inner);

		const { chunks, sink } = recordingSink();
		const result = render(App, { stream: sink });

		d_outer.resolve('outer-done');
		await d_outer.promise;
		await Promise.resolve();
		await Promise.resolve();

		expect(chunks).toHaveLength(2);
		const parent_chunk = chunks[1];
		expect(parent_chunk).toContain('<p class="outer">outer-done</p>');
		// the child is still pending: its slot (wrapper + fallback) ships
		// inside the parent chunk
		expect(parent_chunk).toContain('inner-loading');
		expect(parent_chunk).toMatch(SLOT_OPEN_RE);

		d_inner.resolve('inner-done');
		await result;

		expect(chunks).toHaveLength(3);
		expect(chunks[2]).toContain('<p class="inner">inner-done</p>');
	});

	it('streams sibling boundaries out of order, as each settles', async () => {
		const d_first = deferred<string>();
		const d_second = deferred<string>();

		function First() @{
			let &[data] = trackAsync(() => d_first.promise);
			<p>
				{'first: ' + data}
			</p>
		}

		function Second() @{
			let &[data] = trackAsync(() => d_second.promise);
			<p>
				{'second: ' + data}
			</p>
		}

		function App() @{
			<>
				@try {
					<First />
				} @pending {
					<p>{'first-loading'}</p>
				}
				@try {
					<Second />
				} @pending {
					<p>{'second-loading'}</p>
				}
			</>
		}

		const { chunks, sink } = recordingSink();
		const result = render(App, { stream: sink });

		d_second.resolve('B');
		await d_second.promise;
		await Promise.resolve();
		await Promise.resolve();

		expect(chunks).toHaveLength(2);
		expect(chunks[1]).toContain('second: B');
		expect(chunks[1]).not.toContain('first');

		d_first.resolve('A');
		await result;

		expect(chunks).toHaveLength(3);
		expect(chunks[2]).toContain('first: A');
	});

	it(
		'produces the same document as a non-streaming render regardless of settle order',
		async () => {
			function makeApp(ds: Deferred<string>[]) {
				function A() @{
					let &[data] = trackAsync(() => ds[0].promise);
					<p>
						{'A:' + data}
					</p>
				}
				function B() @{
					let &[data] = trackAsync(() => ds[1].promise);
					<p>
						{'B:' + data}
					</p>
				}
				function C() @{
					let &[data] = trackAsync(() => ds[2].promise);
					<p>
						{'C:' + data}
					</p>
				}

				function App() @{
					<main>
						<h1>{'title'}</h1>
						@try {
							<>
								<A />
								@try {
									<B />
								} @pending {
									<span>{'b-loading'}</span>
								}
							</>
						} @pending {
							<span>{'a-loading'}</span>
						}
						@try {
							<C />
						} @pending {
							<span>{'c-loading'}</span>
						}
					</main>
				}

				return App;
			}

			// adversarial settle orders, including child-before-parent
			const orders = [
				[0, 1, 2],
				[2, 1, 0],
				[1, 2, 0],
			];

			for (const order of orders) {
				const streaming_ds = [deferred<string>(), deferred<string>(), deferred<string>()];
				const { chunks, sink } = recordingSink();
				const streaming = render(makeApp(streaming_ds), { stream: sink });
				for (const index of order) {
					streaming_ds[index].resolve('v' + index);
					await streaming_ds[index].promise;
					await Promise.resolve();
				}
				await streaming;

				const sync_ds = [deferred<string>(), deferred<string>(), deferred<string>()];
				const sync_render = render(makeApp(sync_ds));
				sync_ds.forEach((d, index) => d.resolve('v' + index));
				const { body } = await sync_render;

				expect(normalize(applyStream(chunks))).toBe(normalize(body));
			}
		},
	);
});

describe('streaming root boundary', () => {
	it('suspends at the root boundary when no user try wraps the async read', async () => {
		const d = deferred<string>();

		function App() @{
			let &[data] = trackAsync(() => d.promise);
			<p>
				{'app: ' + data}
			</p>
		}

		function RootPending() @{
			<p>{'root-loading'}</p>
		}

		const { chunks, sink } = recordingSink();
		const result = render(App, { stream: sink, rootBoundary: { pending: RootPending } });

		expect(chunks).toHaveLength(1);
		expect(chunks[0]).toContain('root-loading');
		expect(chunks[0]).toMatch(SLOT_OPEN_RE);

		d.resolve('ready');
		await result;

		expect(chunks).toHaveLength(2);
		expect(chunks[1]).toContain('app: ready');
	});
});

describe('streaming with a document template', () => {
	it('wraps the shell in the scaffold and appends the suffix on close', async () => {
		const d = deferred<string>();

		function Content() @{
			let &[data] = trackAsync(() => d.promise);
			<p>{data}</p>
		}

		function App() @{
			@try {
				<Content />
			} @pending {
				<p>{'loading...'}</p>
			}
		}

		const { chunks, sink, isClosed } = recordingSink();
		const result = render(App, {
			stream: sink,
			streamTemplate: {
				before: '<html><head><title>t</title>',
				between: '</head><body><div id="root">',
				after: '</div></body></html>',
			},
		});

		expect(chunks).toHaveLength(1);
		expect(chunks[0].startsWith('<html><head><title>t</title>')).toBe(true);
		expect(chunks[0]).toContain('</head><body><div id="root">');
		// the shell body follows the scaffold's body opening
		expect(chunks[0].indexOf('<div id="root">')).toBeLessThan(chunks[0].indexOf('loading...'));
		expect(chunks[0]).not.toContain('</html>');

		d.resolve('done');
		await result;

		expect(isClosed()).toBe(true);
		// the suffix is the final push, after the last chunk
		expect(chunks[chunks.length - 1]).toBe('</div></body></html>');
		expect(chunks[chunks.length - 2]).toContain('<p>done</p>');
	});
});

describe('streaming head content', () => {
	it('ships head writes from async content as a head template in the chunk', async () => {
		const d = deferred<string>();

		function LateHead() @{
			let &[data] = trackAsync(() => d.promise);
			<>
				@if (data) {
					<>
						<head>
							<title>
								{'title:' + data}
							</title>
						</head>
						<p class="has-head">{data}</p>
					</>
				}
			</>
		}

		function App() @{
			@try {
				<LateHead />
			} @pending {
				<p>{'loading...'}</p>
			}
		}

		const { chunks, sink } = recordingSink();
		const result = render(App, { stream: sink });

		expect(chunks).toHaveLength(1);
		expect(chunks[0]).not.toContain('<title>');

		d.resolve('late');
		await result;

		expect(chunks).toHaveLength(2);
		const chunk = chunks[1];
		expect(chunk).toMatch(
			/<template data-ripple-head="\d+">[\s\S]*?<title>title:late<\/title>[\s\S]*?<\/template>/,
		);
		expect(chunk).toContain('<p class="has-head">late</p>');
		// the head template precedes the content template
		expect(chunk.indexOf('data-ripple-head')).toBeLessThan(chunk.indexOf('data-ripple-chunk'));
	});
});

describe('streaming CSS', () => {
	it('sends sync CSS with the shell and async-only CSS with its chunk, deduplicated', async () => {
		const d_gate = deferred<boolean>();
		const d_gate2 = deferred<boolean>();

		function LateStyled() @{
			<>
				<style>
					.late-styled {
						color: rgb(1, 2, 3);
					}
				</style>
				<div class="late-styled">{'late'}</div>
			</>
		}

		function GateOne() @{
			let &[ready] = trackAsync(() => d_gate.promise);
			<>
				@if (ready) {
					<LateStyled />
				}
			</>
		}

		function GateTwo() @{
			let &[ready] = trackAsync(() => d_gate2.promise);
			<>
				@if (ready) {
					<LateStyled />
				}
			</>
		}

		function App() @{
			<>
				<style>
					.shell-styled {
						color: rgb(9, 9, 9);
					}
				</style>
				<div class="shell-styled">{'shell'}</div>
				@try {
					<GateOne />
				} @pending {
					<p>{'one-loading'}</p>
				}
				@try {
					<GateTwo />
				} @pending {
					<p>{'two-loading'}</p>
				}
			</>
		}

		const { chunks, sink } = recordingSink();
		const result = render(App, { stream: sink });

		expect(chunks).toHaveLength(1);
		expect(chunks[0]).toContain('.shell-styled');
		expect(chunks[0]).not.toContain('.late-styled');

		d_gate.resolve(true);
		await d_gate.promise;
		await Promise.resolve();
		await Promise.resolve();

		expect(chunks).toHaveLength(2);
		// the chunk carries the style it needs, ahead of its template
		const style_index = chunks[1].indexOf('.late-styled');
		const template_index = chunks[1].indexOf('<template data-ripple-chunk=');
		expect(style_index).toBeGreaterThan(-1);
		expect(style_index).toBeLessThan(template_index);

		d_gate2.resolve(true);
		await result;

		expect(chunks).toHaveLength(3);
		// the second chunk renders the same component but the css was already sent
		expect(chunks[2]).toContain('late');
		expect(chunks[2]).not.toContain('.late-styled');
	});
});
