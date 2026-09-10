import { Props } from 'ripple';

describe('Props helpers on the server', () => {
	it('read plain props like Object', async () => {
		let seen: Record<string, unknown> = {};

		function Child(props: { a: number; b: string }) @{
			seen = {
				keys: Props.keys(props),
				symbols: Props.ownSymbolKeys(props),
				all: Props.ownAllKeys(props),
				values: Props.values(props),
				entries: Props.entries(props),
				has: Props.has(props, 'a'),
				object: Props.spread(props, { c: true }),
				rest: Props.rest(props, 'a'),
			};
			<span>{props.a}</span>
		}

		function App() @{
			<Child a={1} b="s" />
		}

		const { body } = await render(App);
		expect(body).toContain('<span>1</span>');
		expect(seen).toEqual({
			keys: ['a', 'b'],
			symbols: [],
			all: ['a', 'b'],
			values: [1, 's'],
			entries: [
				['a', 1],
				['b', 's'],
			],
			has: true,
			object: { a: 1, b: 's', c: true },
			rest: { b: 's' },
		});
	});
});
