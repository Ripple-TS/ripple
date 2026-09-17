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
	import { track } from 'ripple';

	interface Row {
		id: number;
		label: string;
	}
`;

describe('@for item bodies carrying their render block', () => {
	it('turns the single render block of a keyed item into `_$_.item` and passes its function with the list', () => {
		const code = compile_client(`${ROWS}
			export default function App() @{
				const items = track<Row[]>([]);
				<ul>
					@for (const row of items.value; key row.id) {
						<li class={row.label}>{row.label}</li>
					}
				</ul>
			}
		`);

		expect(code).not.toContain('_$_.render(');
		expect(code).toContain('_$_.item({');
		// key, no empty renderer, no item destructuring, then the update function
		expect(code).toMatch(/\(pattern\) => pattern\.id,\n\s*void 0,\n\s*void 0,\n\s*render\n\s*\);/);
	});

	it('passes the function of a plain list after its empty renderer slot', () => {
		const code = compile_client(`${ROWS}
			export default function App() @{
				const items = track<Row[]>([]);
				<ul>
					@for (const row of items.value) {
						<li>{row.label}</li>
					}
				</ul>
			}
		`);

		expect(code).toContain('_$_.item({');
		expect(code).toMatch(/_\$_\.for\([\s\S]*?\n\s*\d+,\n\s*void 0,\n\s*render\n\s*\);/);
	});

	it('keeps an item body without a render block as it is', () => {
		const code = compile_client(`${ROWS}
			function Item(props: { row: Row }) @{
				<li>{props.row.label}</li>
			}
			export default function App() @{
				const items = track<Row[]>([]);
				<ul>
					@for (const row of items.value; key row.id) {
						<Item row={row} />
					}
				</ul>
			}
		`);

		expect(code).not.toContain('_$_.item(');
		expect(code).toMatch(/\(pattern\) => pattern\.id\n\s*\);/);
	});
});

describe('trailing control flow appending into its parent', () => {
	it('drops the placeholder of a trailing @for behind a template sibling', () => {
		const code = compile_client(`${ROWS}
			export default function App() @{
				const items = track<Row[]>([]);
				<tr>
					<th>{'label'}</th>
					@for (const row of items.value; key row.id) {
						<td>{row.label}</td>
					}
				</tr>
			}
		`);

		expect(code).toContain('_$_.template(`<tr><th>label`');
		expect(code).toContain('_$_.hydrating ? _$_.hydrate_sibling() : _$_.append_into(tr)');
	});

	it('drops the placeholder of a trailing @if and keeps one for a @for that is not last', () => {
		const code = compile_client(`${ROWS}
			export default function App() @{
				const items = track<Row[]>([]);
				const open = track(false);
				<div>
					<b>{'head'}</b>
					@for (const row of items.value; key row.id) {
						<span>{row.label}</span>
					}
					@if (open.value) {
						<i>{'open'}</i>
					}
				</div>
			}
		`);

		// The list is followed by the if, so it keeps its placeholder; the if
		// is last and appends into the div, as its tail: it never needs an
		// anchor of its own.
		expect(code).toContain("_$_.template_el('div', null, [['b', null, 'head'], null])");
		expect(code).toContain('_$_.append_into(div, true)');
	});

	it('marks only the @if that closes the trailing run as the tail', () => {
		const code = compile_client(`${ROWS}
			function Footer() @{
				<i>{'footer'}</i>
			}
			export default function App() @{
				const open = track(false);
				<div>
					<b>{'head'}</b>
					@if (open.value) {
						<i>{'open'}</i>
					}
					<Footer />
				</div>
			}
		`);

		// The footer follows the if, so the if materializes an anchor when it
		// needs a position (no tail flag).
		expect(code).toContain('_$_.append_into(div)');
		expect(code).not.toContain('_$_.append_into(div, true)');
	});

	it('keeps the placeholder of a @for followed by a component', () => {
		const code = compile_client(`${ROWS}
			function Footer() @{
				<i>{'footer'}</i>
			}
			export default function App() @{
				const items = track<Row[]>([]);
				<div>
					<b>{'head'}</b>
					@for (const row of items.value; key row.id) {
						<span>{row.label}</span>
					}
					<Footer />
				</div>
			}
		`);

		expect(code).toContain("_$_.template_el('div', null, [['b', null, 'head'], null])");
	});
});

describe('local keyed items', () => {
	it('holds an item read only by its update function as it is', () => {
		const code = compile_client(`${ROWS}
			export default function App() @{
				const items = track<Row[]>([]);
				<ul>
					@for (const row of items.value; key row.id) {
						<li class={row.label}>{row.label}</li>
					}
				</ul>
			}
		`);

		// IS_CONTROLLED | LOCAL_ITEMS, and the state holds the item itself
		expect(code).toMatch(/\n\s*132,\n\s*\(pattern\) => pattern\.id,/);
		expect(code).toContain('var __pattern = __prev.$item;');
		expect(code).not.toMatch(/_\$_\.get\(__prev\._[a-z]+\)/);
	});

	it('keeps a tracked item when the body reads it outside the update function', () => {
		const code = compile_client(`${ROWS}
			function Label(props: { text: string }) @{
				<b>{props.text}</b>
			}
			export default function App() @{
				const items = track<Row[]>([]);
				<ul>
					@for (const row of items.value; key row.id) {
						<li class={row.label}><Label text={row.label} /></li>
					}
				</ul>
			}
		`);

		expect(code).toMatch(/\n\s*4,\n\s*\(pattern\) => pattern\.id,/);
		expect(code).toMatch(/_\$_\.get\(__prev\._[a-z]+\)/);
	});

	it('keeps a tracked item for an indexed loop', () => {
		const code = compile_client(`${ROWS}
			export default function App() @{
				const items = track<Row[]>([]);
				<ul>
					@for (const row of items.value; index i; key row.id) {
						<li>{i + row.label}</li>
					}
				</ul>
			}
		`);

		expect(code).toMatch(/\n\s*12,\n\s*\(pattern, i\) => pattern\.id,/);
	});
});
