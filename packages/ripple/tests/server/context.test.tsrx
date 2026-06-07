import { Context } from 'ripple';

describe('Context API', () => {
	it('handles context override in nested components', async () => {
		const MessageContext = new Context('default');

		function Inner() @{
			const msg = MessageContext.get();
			<span>{msg}</span>
		}

		function Middle() @{
			MessageContext.set('middle');
			<div>
				<Inner />
			</div>
		}

		function Outer() @{
			MessageContext.set('outer');
			<>
				<Middle />
				<Inner />
			</>
		}

		const { body } = await render(Outer);

		expect(body).toBeHtml('<div><span>middle</span></div><span>outer</span>');
	});
});
