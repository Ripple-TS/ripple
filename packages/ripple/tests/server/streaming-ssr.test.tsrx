import { create_ssr_stream } from 'ripple/server';

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
});
