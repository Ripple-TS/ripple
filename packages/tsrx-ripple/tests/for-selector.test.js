import { describe, expect, it } from 'vitest';
import { compile } from '../src/index.js';

/**
 * @param {string} source
 * @returns {string}
 */
function compile_client(source) {
	const { code, errors } = compile(source, 'App.tsrx', { mode: 'client' });
	expect(errors).toEqual([]);
	return code;
}

const ROWS = `
	import { track, type Tracked } from 'ripple';

	interface Row {
		id: number;
		label: Tracked<string>;
	}
`;

describe('@for selector lowering', () => {
	it('lowers `outer === item` in a render attribute to a shared selector', () => {
		const code = compile_client(`${ROWS}
			export default function App() @{
				let &[items] = track<Row[]>([]);
				let &[selected] = track<number | undefined>(undefined);
				@for (const row of items; key row.id) {
					<tr class={selected === row.id ? 'danger' : ''}>{row.id}</tr>
				}
			}
		`);

		expect(code).toContain('const selector = _$_.selector(() => lazy_1.value);');
		expect(code).toContain("_$_.selector_match(selector, __pattern.id) ? 'danger' : ''");
		expect(code.indexOf('_$_.selector(')).toBeLessThan(code.indexOf('_$_.for_keyed('));
	});

	it('lowers the reversed operand order and negates `!==`', () => {
		const code = compile_client(`${ROWS}
			export default function App() @{
				let &[items] = track<Row[]>([]);
				let &[selected] = track<number | undefined>(undefined);
				@for (const row of items; key row.id) {
					<tr class={row.id !== selected ? 'plain' : 'danger'}>{row.id}</tr>
				}
			}
		`);

		expect(code).toContain("!_$_.selector_match(selector, __pattern.id) ? 'plain' : 'danger'");
	});

	it('lowers text expressions and unkeyed loops', () => {
		const code = compile_client(`${ROWS}
			export default function App() @{
				let &[items] = track<Row[]>([]);
				let &[selected] = track<number | undefined>(undefined);
				@for (const row of items) {
					<tr>{selected === row.id ? 'selected' : ''}</tr>
				}
			}
		`);

		expect(code).toContain('_$_.selector(() => lazy_1.value)');
		expect(code).toContain('_$_.selector_match(selector, row.id)');
	});

	it('keeps a plain comparison when the outer side is static', () => {
		const code = compile_client(`${ROWS}
			const FIXED = 3;
			export default function App() @{
				let &[items] = track<Row[]>([]);
				@for (const row of items; key row.id) {
					<tr class={FIXED === row.id ? 'danger' : ''}>{row.id}</tr>
				}
			}
		`);

		expect(code).not.toContain('_$_.selector');
		expect(code).toContain("FIXED === __pattern.id ? 'danger' : ''");
	});

	it('keeps comparisons inside callbacks, handlers, and calls', () => {
		const code = compile_client(`${ROWS}
			export default function App() @{
				let &[items] = track<Row[]>([]);
				let &[selected] = track<number | undefined>(undefined);
				const pick = (id: number) => id;
				@for (const row of items; key row.id) {
					<tr
						class={[row.id].some((id) => selected === id) ? 'danger' : ''}
						title={pick(selected) === row.id ? 'picked' : ''}
						onClick={() => console.log(selected === row.id)}
					>{row.id}</tr>
				}
			}
		`);

		expect(code).not.toContain('_$_.selector');
	});

	it('keeps comparisons that read state local to the loop body', () => {
		const code = compile_client(`${ROWS}
			export default function App() @{
				let &[items] = track<Row[]>([]);
				let &[selected] = track<number | undefined>(undefined);
				@for (const row of items; key row.id) {
					const offset = row.id * 2;
					<tr class={selected === offset ? 'danger' : ''}>{row.id}</tr>
				}
			}
		`);

		expect(code).not.toContain('_$_.selector');
	});

	it('registers one selector per loop instance for nested loops', () => {
		const code = compile_client(`${ROWS}
			export default function App() @{
				let &[groups] = track<Row[][]>([]);
				let &[selected] = track<number | undefined>(undefined);
				@for (const group of groups; key group.length) {
					@for (const row of group; key row.id) {
						<tr class={selected === row.id ? 'danger' : ''}>{row.id}</tr>
					}
				}
			}
		`);

		expect(code.match(/_\$_\.selector\(/g)).toHaveLength(1);
		expect(code.indexOf('_$_.selector(')).toBeGreaterThan(code.indexOf('_$_.for_keyed('));
	});
});

describe('grouped render read hoisting', () => {
	it('does not hoist an item read only on conditional paths', () => {
		const code = compile_client(`${ROWS}
			export default function App() @{
				let &[items] = track<Row[]>([]);
				let &[ready] = track(false);
				@for (const row of items; key row.id) {
					<tr title={ready ? row.label.value : 'pending'} class={ready && row.label.value}>{'x'}</tr>
				}
			}
		`);

		expect(code).not.toContain('var __pattern');
		// Two guarded reads in the render plus the key function.
		expect(code.match(/_\$_\.get\(pattern\)/g)).toHaveLength(3);
	});

	it('leaves reads inside nested functions alone', () => {
		const code = compile_client(`${ROWS}
			export default function App() @{
				let &[items] = track<Row[]>([]);
				@for (const row of items; key row.id) {
					<tr title={row.label.value} class={[row.id].some((id) => row.id === id) ? 'x' : ''}>{'x'}</tr>
				}
			}
		`);

		// The call is wrapped in a scope arrow, so its reads are nested and
		// only the title read is unconditional: nothing to hoist.
		expect(code).not.toContain('var __pattern');
		expect(code).toContain('[_$_.get(pattern).id].some((id) => _$_.get(pattern).id === id)');
	});

	it('reuses an unconditional read on conditional paths too', () => {
		const code = compile_client(`${ROWS}
			export default function App() @{
				let &[items] = track<Row[]>([]);
				let &[ready] = track(false);
				@for (const row of items; key row.id) {
					<tr title={row.label.value} class={ready ? row.label.value : ''}>{'x'}</tr>
				}
			}
		`);

		expect(code).toContain('var __pattern = _$_.get(pattern);');
		expect(code).not.toContain('_$_.get(pattern).label');
	});
});

describe('@for item type inference', () => {
	it('lowers typed member reads on the loop item to text updates', () => {
		const code = compile_client(`${ROWS}
			export default function App() @{
				let &[items] = track<Row[]>([]);
				@for (const row of items; key row.id) {
					<tr><td>{row.id}</td><td>{row.label.value}</td></tr>
				}
			}
		`);

		expect(code).not.toContain('_$_.expression(');
		expect(code).toContain('_$_.set_text(');
		expect(code).toContain('var __pattern = _$_.get(pattern);');
		expect(code).toContain('__pattern.label.value');
	});

	it('follows type aliases, `Array<T>`, and annotated declarations', () => {
		const code = compile_client(`
			import { track } from 'ripple';

			type Item = { name: string; nested: { count: number } };
			export default function App() @{
				let &[items] = track<Array<Item>>([]);
				const fixed: Item[] = [];
				<>
					@for (const item of items; key item.name) {
						<p>{item.nested.count}</p>
					}
					@for (const item of fixed; key item.name) {
						<p>{item.name}</p>
					}
				</>
			}
		`);

		// The fragment itself renders through expression(); the loop bodies do not.
		expect(code.match(/_\$_\.set_text\(/g)).toHaveLength(2);
		expect(code).not.toContain('_$_.expression(expression');
	});

	it('keeps the generic expression for untyped items', () => {
		const code = compile_client(`
			import { track } from 'ripple';

			export default function App() @{
				let &[items] = track([]);
				@for (const item of items; key item.id) {
					<p>{item.content}</p>
				}
			}
		`);

		expect(code).toContain('_$_.expression(');
	});

	it('types the bindings of a lazily destructured props pattern', () => {
		const code = compile_client(`
			type Item = { id: number; nested: { label: string } };

			export default function Row(&{ item, extra: { count } }: { item: Item; extra: { count: number } }) @{
				<tr><td>{item.id}</td><td>{item.nested.label}</td><td>{count}</td></tr>
			}
		`);

		expect(code).not.toContain('_$_.expression(');
		expect(code.match(/_\$_\.set_text\(/g)).toHaveLength(3);
		expect(code).toContain('__props.item.id');
		expect(code).toContain('__props.extra.count');
	});

	it('types the bindings of a lazy object pattern declaration', () => {
		const code = compile_client(`
			export default function Row(props: { item: { id: number } }) @{
				const &{ item } = props;
				<p>{item.id}</p>
			}
		`);

		expect(code).not.toContain('_$_.expression(');
		expect(code).toContain('_$_.set_text(');
	});

	it('types the bindings of a regular destructured props pattern', () => {
		const code = compile_client(`
			export default function Row({ item, extra: { count } }: { item: { id: number }; extra: { count: number } }) @{
				<tr><td>{item.id}</td><td>{count}</td></tr>
			}
		`);

		expect(code).not.toContain('_$_.expression(');
		expect(code).toContain('_$_.set_text(expression, __prev.a = __a)');
		expect(code).toContain('expression_1.nodeValue = count');
	});

	it('types the bindings of a regular object pattern declaration', () => {
		const code = compile_client(`
			export default function Row(props: { item: { id: number }; extra: { count: number } }) @{
				const { item, extra: { count } } = props;
				<tr><td>{item.id}</td><td>{count}</td></tr>
			}
		`);

		expect(code).not.toContain('_$_.expression(');
		expect(code).toContain('_$_.set_text(expression, __prev.a = __a)');
		expect(code).toContain('expression_1.nodeValue = count');
	});

	it('infers number and boolean literal initial values of track()', () => {
		const code = compile_client(`
			import { track } from 'ripple';

			export default function App() @{
				let &[count] = track(0);
				let &[content] = track('');
				<><p>{count}</p><p>{content}</p></>
			}
		`);

		expect(code).toContain('_$_.set_text(');
		expect(code).toContain('_$_.expression(');
	});
});
