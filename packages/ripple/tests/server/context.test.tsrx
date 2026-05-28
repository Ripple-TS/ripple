import { Context } from 'ripple';

describe('Context API', () => {
	it('handles context override in nested components', async () => {
		const MessageContext = Context('default');

		function Inner() {
			return <>
				const msg = MessageContext.get();
				<span>{msg}</span>
			</>;
		}

		function Middle() {
			return <>
				MessageContext.set('middle');
				<div>
					<Inner />
				</div>
			</>;
		}

		function Outer() {
			return <>
				MessageContext.set('outer');
				<Middle />
				<Inner />
			</>;
		}

		const { body } = await render(Outer);

		expect(body).toBeHtml('<div><span>middle</span></div><span>outer</span>');
	});
});
