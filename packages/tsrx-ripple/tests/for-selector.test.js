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
				const items = track<Row[]>([]);
				const selected = track<number | undefined>(undefined);
				@for (const row of items.value; key row.id) {
					<tr class={selected.value === row.id ? 'danger' : ''}>{row.id}</tr>
				}
			}
		`);

		expect(code).toContain('const selector = _$_.selector(() => selected.value);');
		// The comparison reads the item's key, fixed for the block's life,
		// through the render function's key parameter: the render block then
		// depends on the selector alone.
		expect(code).toContain('(__anchor, pattern, index, key) => {');
		expect(code).toContain("_$_.selector_match(__prev._selector, __prev._key) ? 'danger' : ''");
		expect(code.indexOf('_$_.selector(')).toBeLessThan(code.indexOf('_$_.for_keyed('));
	});

	it('lowers the reversed operand order and negates `!==`', () => {
		const code = compile_client(`${ROWS}
			export default function App() @{
				const items = track<Row[]>([]);
				const selected = track<number | undefined>(undefined);
				@for (const row of items.value; key row.id) {
					<tr class={row.id !== selected.value ? 'plain' : 'danger'}>{row.id}</tr>
				}
			}
		`);

		expect(code).toContain(
			"!_$_.selector_match(__prev._selector, __prev._key) ? 'plain' : 'danger'",
		);
	});

	it('lowers text expressions and unkeyed loops', () => {
		const code = compile_client(`${ROWS}
			export default function App() @{
				const items = track<Row[]>([]);
				const selected = track<number | undefined>(undefined);
				@for (const row of items.value) {
					<tr>{selected.value === row.id ? 'selected' : ''}</tr>
				}
			}
		`);

		expect(code).toContain('_$_.selector(() => selected.value)');
		expect(code).toContain('_$_.selector_match(__prev._selector, __prev._row.id)');
	});

	it('lowers an @if condition in the loop body, reading the item key as the block key', () => {
		const code = compile_client(`${ROWS}
			export default function App() @{
				const items = track<Row[]>([]);
				const selected = track<number | undefined>(undefined);
				@for (const row of items.value; key row.id) {
					<tr>
						<td>{row.id}</td>
						@if (selected.value === row.id) {
							<td>{'selected'}</td>
						}
					</tr>
				}
			}
		`);

		expect(code).toContain('const selector = _$_.selector(() => selected.value);');
		expect(code).toContain('(__anchor, pattern, index, key) => {');
		// The hoisted condition captures the selector and the key, not the item.
		expect(code).toContain('function if_1({ a: selector, b: key }) {');
		expect(code).toContain('if (_$_.selector_match(selector, key)) return consequent;');
	});

	it('shares one selector between an attribute and an @if reading the same outer value', () => {
		const code = compile_client(`${ROWS}
			export default function App() @{
				const items = track<Row[]>([]);
				const selected = track<number | undefined>(undefined);
				@for (const row of items.value; key row.id) {
					<tr class={selected.value === row.id ? 'danger' : ''}>
						<td>{row.id}</td>
						@if (selected.value === row.id) {
							<td>{'selected'}</td>
						}
					</tr>
				}
			}
		`);

		expect(code.match(/_\$_\.selector\(/g)).toHaveLength(1);
		expect(code).toContain("_$_.selector_match(__prev._selector, __prev._key) ? 'danger' : ''");
		expect(code).toContain('if (_$_.selector_match(selector, key)) return consequent;');
	});

	it('reads the item, not the key, when the compared member is not the key', () => {
		const code = compile_client(`
			import { track } from 'ripple';
			interface Row {
				id: number;
				group: string;
			}
			export default function App() @{
				const items = track<Row[]>([]);
				const group = track<string | undefined>(undefined);
				@for (const row of items.value; key row.id) {
					<tr>
						<td>{row.id}</td>
						@if (group.value === row.group) {
							<td>{'match'}</td>
						}
					</tr>
				}
			}
		`);

		expect(code).toContain('(__anchor, pattern) => {');
		expect(code).toContain(
			'if (_$_.selector_match(selector, _$_.get(pattern).group)) return consequent;',
		);
	});

	it('keeps a plain comparison when the outer side is static', () => {
		const code = compile_client(`${ROWS}
			const FIXED = 3;
			export default function App() @{
				const items = track<Row[]>([]);
				@for (const row of items.value; key row.id) {
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
				const items = track<Row[]>([]);
				const selected = track<number | undefined>(undefined);
				const pick = (id: number) => id;
				@for (const row of items.value; key row.id) {
					<tr
						class={[row.id].some((id) => selected.value === id) ? 'danger' : ''}
						title={pick(selected.value) === row.id ? 'picked' : ''}
						onClick={() => console.log(selected.value === row.id)}
					>{row.id}</tr>
				}
			}
		`);

		expect(code).not.toContain('_$_.selector');
	});

	it('keeps comparisons that read state local to the loop body', () => {
		const code = compile_client(`${ROWS}
			export default function App() @{
				const items = track<Row[]>([]);
				const selected = track<number | undefined>(undefined);
				@for (const row of items.value; key row.id) {
					const offset = row.id * 2;
					<tr class={selected.value === offset ? 'danger' : ''}>{row.id}</tr>
				}
			}
		`);

		expect(code).not.toContain('_$_.selector');
	});

	it('registers one selector per loop instance for nested loops', () => {
		const code = compile_client(`${ROWS}
			export default function App() @{
				const groups = track<Row[][]>([]);
				const selected = track<number | undefined>(undefined);
				@for (const group of groups.value; key group.length) {
					@for (const row of group; key row.id) {
						<tr class={selected.value === row.id ? 'danger' : ''}>{row.id}</tr>
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
				const items = track<Row[]>([]);
				const ready = track(false);
				@for (const row of items.value; key row.id) {
					<tr title={ready.value ? row.label.value : 'pending'} class={ready.value && row.label.value}>{'x'}</tr>
				}
			}
		`);

		expect(code).not.toContain('var __pattern');
		// Two guarded reads in the render (through the block state); the key
		// function reads the item itself.
		expect(code.match(/__prev\.\$item\b/g)).toHaveLength(2);
		expect(code).toContain('(pattern) => pattern.id');
	});

	it('leaves reads inside nested functions alone', () => {
		const code = compile_client(`${ROWS}
			export default function App() @{
				const items = track<Row[]>([]);
				@for (const row of items.value; key row.id) {
					<tr title={row.label.value} class={[row.id].some((id) => row.id === id) ? 'x' : ''}>{'x'}</tr>
				}
			}
		`);

		// The call is wrapped in a scope arrow, so its reads are nested and
		// only the title read is unconditional: nothing to hoist.
		expect(code).not.toContain('var __pattern');
		expect(code).toContain('[__prev.$item.id].some((id) => __prev.$item.id === id)');
	});

	it('reuses an unconditional read on conditional paths too', () => {
		const code = compile_client(`${ROWS}
			export default function App() @{
				const items = track<Row[]>([]);
				const ready = track(false);
				@for (const row of items.value; key row.id) {
					<tr title={row.label.value} class={ready.value ? row.label.value : ''}>{'x'}</tr>
				}
			}
		`);

		expect(code).toContain('var __pattern = __prev.$item;');
		expect(code).not.toContain('_$_.get(pattern).label');
	});
});

describe('@for item type inference', () => {
	it('lowers typed member reads on the loop item to text updates', () => {
		const code = compile_client(`${ROWS}
			export default function App() @{
				const items = track<Row[]>([]);
				@for (const row of items.value; key row.id) {
					<tr><td>{row.id}</td><td>{row.label.value}</td></tr>
				}
			}
		`);

		expect(code).not.toContain('_$_.expression(');
		expect(code).toContain('_$_.set_text_content(');
		expect(code).toContain('var __pattern = __prev.$item;');
		expect(code).toContain('__pattern.label.value');
	});

	it('follows type aliases, `Array<T>`, and annotated declarations', () => {
		const code = compile_client(`
			import { track } from 'ripple';

			type Item = { name: string; nested: { count: number } };
			export default function App() @{
				const items = track<Array<Item>>([]);
				const fixed: Item[] = [];
				<>
					@for (const item of items.value; key item.name) {
						<p>{item.nested.count}</p>
					}
					@for (const item of fixed; key item.name) {
						<p>{item.name}</p>
					}
				</>
			}
		`);

		// The fragment itself renders through expression(); the loop bodies do not.
		expect(code.match(/_\$_\.set_text_content\(/g)).toHaveLength(2);
		expect(code).not.toContain('_$_.expression(expression');
	});

	it('keeps the generic expression for untyped items', () => {
		const code = compile_client(`
			import { track } from 'ripple';

			export default function App() @{
				const items = track([]);
				@for (const item of items.value; key item.id) {
					<p>{item.content}</p>
				}
			}
		`);

		expect(code).toContain('_$_.expression(');
	});

	it('types the bindings of a regular destructured props pattern', () => {
		const code = compile_client(`
			export default function Row({ item, extra: { count } }: { item: { id: number }; extra: { count: number } }) @{
				<tr><td>{item.id}</td><td>{count}</td></tr>
			}
		`);

		expect(code).not.toContain('_$_.expression(');
		expect(code).toContain('_$_.set_text_content(__prev._td, __a, __prev.a)');
		expect(code).toContain('td_1.textContent = count');
	});

	it('types the bindings of a regular object pattern declaration', () => {
		const code = compile_client(`
			export default function Row(props: { item: { id: number }; extra: { count: number } }) @{
				const { item, extra: { count } } = props;
				<tr><td>{item.id}</td><td>{count}</td></tr>
			}
		`);

		expect(code).not.toContain('_$_.expression(');
		expect(code).toContain('_$_.set_text_content(__prev._td, __a, __prev.a)');
		expect(code).toContain('td_1.textContent = count');
	});

	it('types track() calls by their explicit type argument', () => {
		const code = compile_client(`
			import { track } from 'ripple';

			export default function App() @{
				const label = track<string>('');
				const n = track<number>();
				const raw = track('');
				<><p>{label.value}</p><p>{n.value}</p><p>{raw.value}</p></>
			}
		`);

		// The parser exposes call generics as \`typeArguments\`; both typed calls
		// lower to direct text writes, the untyped one keeps the generic expression.
		expect(code.match(/_\$_\.set_text_content\(/g)).toHaveLength(2);
		expect(code).toContain('_$_.expression(expression_2, () => raw.value)');
	});

	it('infers number and boolean literal initial values of track()', () => {
		const code = compile_client(`
			import { track } from 'ripple';

			export default function App() @{
				const count = track(0);
				const content = track('');
				<><p>{count.value}</p><p>{content.value}</p></>
			}
		`);

		expect(code).toContain('_$_.set_text_content(');
		expect(code).toContain('_$_.expression(');
	});
});
