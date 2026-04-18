import { create_ssr_stream } from 'ripple/server';

describe('create_ssr_stream', () => {
	it('renders SSR HTML into the injected sink and exposes a web stream', async () => {
		component App() {
			<div>{'Hello, streaming SSR!'}</div>
		}

		const { stream, sink } = create_ssr_stream();

		expect(stream).toBeInstanceOf(ReadableStream);
		await render(App, { stream: sink });

		const html = await new Response(stream).text();
		expect(html).toBeHtml('<div>Hello, streaming SSR!</div>');
	});

	it('closes the public stream when streaming finishes successfully', async () => {
		component App() {
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
});

// import { renderToStream } from 'ripple/server';

// describe('render to stream', () => {
// test('renderToStream renders a simple component', async ({ expect }) => {
// 	component Basic() {
// 		<div>{'Hello, streaming SSR!'}</div>
// 	}

// 	const stream = renderToStream(Basic);

// 	let result = '';
// 	await new Promise((resolve) => {
// 		stream.on('data', (chunk) => {
// 			result += chunk.toString();
// 		});
// 		stream.on('end', resolve);
// 	});

// 	expect(result).toBe('<div>Hello, streaming SSR!</div>');
// });

// test('renderToStream handles async components', async ({ expect }) => {
// 	component AsyncComponent() {
// 		await new Promise((resolve) => setTimeout(resolve, 10));
// 		<p>{'Async content loaded.'}</p>
// 	}

// 	const stream = renderToStream(AsyncComponent);

// 	let result = '';
// 	await new Promise((resolve) => {
// 		stream.on('data', (chunk) => {
// 			result += chunk.toString();
// 		});
// 		stream.on('end', resolve);
// 	});

// 	expect(result).toBe('<p>Async content loaded.</p>');
// });

// test('renderToStream handles await blocks with pending state', async ({ expect }) => {
// 	component AwaitComponent() {
// 		let data = 'initial';
// 		await new Promise((resolve) => setTimeout(() => {
// 			data = 'resolved';
// 			resolve('');
// 		}, 20));
// 		try {
// 			<div>
// 				{'Data: '}
// 				{data}
// 			</div>
// 		} pending {
// 			<div>{'Loading...'}</div>
// 		}
// 	}

// 	const stream = renderToStream(AwaitComponent);

// 	let result = '';
// 	await new Promise((resolve) => {
// 		stream.on('data', (chunk) => {
// 			result += chunk.toString();
// 		});
// 		stream.on('end', resolve);
// 	});

// 	expect(result).toBe('<!--[--><div>Loading...</div><div>Data: resolved</div><!--]-->');
// });
// });
