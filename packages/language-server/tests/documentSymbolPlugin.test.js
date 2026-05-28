import { SymbolKind } from '@volar/language-server';
import { describe, expect, it } from 'vitest';
import {
	child_names,
	create_symbol_harness,
	find_symbol,
	get_range_text,
	symbol_name_kinds,
} from './setup.js';

describe('document symbol plugin', () => {
	it('returns mapped Ripple symbols through the Volar language service', async () => {
		const source = `type Mode = 'idle' | 'active';

interface Props {
	label: string;
}

const config = {
	value: 1,
};

class Store {
	value = 1;
	read() {
		return this.value;
	}
}

function App() { return <>
	const count = 0;
	function increment() {
		const next = count + 1;
		return next;
	}
	const reset = () => {
		const next = 0;
		return next;
	};
	<div>{count}</div>
</>; }
`;

		const { document, service, uri } = create_symbol_harness(source);
		const symbols = await service.getDocumentSymbols(uri);

		expect(symbol_name_kinds(symbols)).toEqual([
			['Mode', SymbolKind.TypeParameter],
			['Props', SymbolKind.Interface],
			['config', SymbolKind.Constant],
			['Store', SymbolKind.Class],
			['App', SymbolKind.Function],
		]);
		expect(child_names(symbols, 'Store')).toEqual(['value', 'read']);
		expect(child_names(symbols, 'App')).toEqual(['count', 'increment', 'reset']);
		expect(child_names(symbols, 'increment')).toEqual(['next']);
		expect(child_names(symbols, 'reset')).toEqual(['next']);

		const app = find_symbol(symbols, 'App');
		const increment = find_symbol(symbols, 'increment');
		expect(app && get_range_text(document, app.selectionRange)).toBe('App');
		expect(increment && get_range_text(document, increment.selectionRange)).toBe('increment');
	});

	it('returns symbols for named export declarations', async () => {
		const source = `export type Mode = 'idle' | 'active';
export interface Props {
	label: string;
}
export const named = 1;
export function makeThing() {
	const inner = 1;
	return inner;
}
export class Store {
	value = 1;
	read() {
		return this.value;
	}
}
export function Card() { return <>
	const title = 'Card';
	<div>{title}</div>
</>; }
`;

		const { service, uri } = create_symbol_harness(source, 'named-exports.tsrx');
		const symbols = await service.getDocumentSymbols(uri);

		expect(symbol_name_kinds(symbols)).toEqual([
			['Mode', SymbolKind.TypeParameter],
			['Props', SymbolKind.Interface],
			['named', SymbolKind.Constant],
			['makeThing', SymbolKind.Function],
			['Store', SymbolKind.Class],
			['Card', SymbolKind.Function],
		]);
		expect(child_names(symbols, 'makeThing')).toEqual(['inner']);
		expect(child_names(symbols, 'Store')).toEqual(['value', 'read']);
		expect(child_names(symbols, 'Card')).toEqual(['title']);
	});

	it('returns symbols for default export declarations', async () => {
		const source = `export default function App() {
	const route = '/';
	return route;
}
export default class Store {
	value = 1;
	read() {
		return this.value;
	}
}
export default function Page() { return <>
	const title = 'Home';
	<div>{title}</div>
</>; }
`;

		const { service, uri } = create_symbol_harness(source, 'default-exports.tsrx');
		const symbols = await service.getDocumentSymbols(uri);

		expect(symbol_name_kinds(symbols)).toEqual([
			['App', SymbolKind.Function],
			['Store', SymbolKind.Class],
			['Page', SymbolKind.Function],
		]);
		expect(child_names(symbols, 'App')).toEqual(['route']);
		expect(child_names(symbols, 'Store')).toEqual(['value', 'read']);
		expect(child_names(symbols, 'Page')).toEqual(['title']);
	});

	it('returns default symbols for anonymous default export declarations', async () => {
		const source = `export default function () {
	const hiddenFunction = 1;
	return hiddenFunction;
}
export default class {
	value = 1;
	read() {
		return this.value;
	}
}
export default function() { return <>
	const hiddenComponent = 1;
	<div>{hiddenComponent}</div>
</>; }
`;

		const { service, uri } = create_symbol_harness(source, 'anonymous-default-exports.tsrx');
		const symbols = await service.getDocumentSymbols(uri);

		expect(symbol_name_kinds(symbols)).toEqual([
			['default', SymbolKind.Function],
			['default', SymbolKind.Class],
			['default', SymbolKind.Function],
		]);
		expect(symbols?.[0].children?.map((symbol) => symbol.name)).toEqual(['hiddenFunction']);
		expect(symbols?.[1].children?.map((symbol) => symbol.name)).toEqual(['value', 'read']);
		expect(symbols?.[2].children?.map((symbol) => symbol.name)).toEqual(['hiddenComponent']);
	});

	it('does not return fallback symbols for anonymous default export expressions', async () => {
		const source = `export default () => {
	const hiddenArrow = 1;
	return hiddenArrow;
};
export default { value: 1 };
`;

		const { service, uri } = create_symbol_harness(source, 'anonymous-default-expressions.tsrx');
		const symbols = await service.getDocumentSymbols(uri);

		expect(symbols).toEqual([]);
	});

	it('keeps local declaration symbols for named export specifiers', async () => {
		const source = `const local = 1;
function helper() {
	const inner = 1;
	return inner;
}
export { local, helper as renamedHelper };
`;

		const { service, uri } = create_symbol_harness(source, 'export-specifiers.tsrx');
		const symbols = await service.getDocumentSymbols(uri);

		expect(symbol_name_kinds(symbols)).toEqual([
			['local', SymbolKind.Constant],
			['helper', SymbolKind.Function],
		]);
		expect(child_names(symbols, 'helper')).toEqual(['inner']);
		expect(find_symbol(symbols, 'renamedHelper')).toBeUndefined();
	});

	it('uses variable declaration kind for let and var declarations', async () => {
		const source = `const fixed = 1;
let mutable = 2;
var legacy = 3;
function App() { return <>
	let local = 4;
	var oldLocal = 5;
	<div>{local + oldLocal}</div>
</>; }
`;

		const { service, uri } = create_symbol_harness(source, 'variable-kinds.tsrx');
		const symbols = await service.getDocumentSymbols(uri);

		expect(symbol_name_kinds(symbols)).toEqual([
			['fixed', SymbolKind.Constant],
			['mutable', SymbolKind.Variable],
			['legacy', SymbolKind.Variable],
			['App', SymbolKind.Function],
		]);
		expect(find_symbol(symbols, 'local')?.kind).toBe(SymbolKind.Variable);
		expect(find_symbol(symbols, 'oldLocal')?.kind).toBe(SymbolKind.Variable);
	});

	it('returns symbols for object and array binding patterns', async () => {
		const source = `function App(props, items) { return <>
	const { alpha, beta: renamed, gamma = 1, nested: { delta }, ...rest } = props;
	let [first, , second = 2, ...others] = items;
	<div>{alpha + renamed + gamma + delta + rest + first + second + others}</div>
</>; }
`;

		const { service, uri } = create_symbol_harness(source, 'binding-patterns.tsrx');
		const symbols = await service.getDocumentSymbols(uri);

		expect(child_names(symbols, 'App')).toEqual([
			'alpha',
			'renamed',
			'gamma',
			'delta',
			'rest',
			'first',
			'second',
			'others',
		]);
		expect(find_symbol(symbols, 'alpha')?.kind).toBe(SymbolKind.Constant);
		expect(find_symbol(symbols, 'renamed')?.kind).toBe(SymbolKind.Constant);
		expect(find_symbol(symbols, 'first')?.kind).toBe(SymbolKind.Variable);
		expect(find_symbol(symbols, 'others')?.kind).toBe(SymbolKind.Variable);
	});

	it('keeps parent ranges wide enough to contain nested local symbols', async () => {
		const source = `export function App() { return <>
	const test = 'hello';
	let { start, loc } = /** @type {AST.NodeWithLocation} */ (node);
	try {
		<AsyncProfile />
	} pending {
		<p class="pending">{'Loading profile...'}</p>
	} catch (err) {
		<p class="error">{(err as Error).message}</p>
	}
</>; }

function helper() {
	const inner = 1;
	return inner;
}
`;

		const { service, uri } = create_symbol_harness(source, 'breadcrumb-ranges.tsrx');
		const symbols = await service.getDocumentSymbols(uri);
		const app = find_symbol(symbols, 'App');
		const helper = find_symbol(symbols, 'helper');

		for (const name of ['test', 'start', 'loc']) {
			const local = find_symbol(symbols, name);
			expect(app && local && range_contains(app.range, local.selectionRange)).toBe(true);
		}
		const inner = find_symbol(symbols, 'inner');
		expect(helper && inner && range_contains(helper.range, inner.selectionRange)).toBe(true);
	});

	it('returns child symbols from function, arrow, and component initializers', async () => {
		const source = `const withFunction = function () {
	const insideFunction = 1;
	return insideFunction;
};
const withArrow = () => {
	const insideArrow = 1;
	return insideArrow;
};
const withComponent = function Inner() { return <>
	const insideComponent = 1;
	<div>{insideComponent}</div>
</>; };
`;

		const { service, uri } = create_symbol_harness(source, 'initializer-children.tsrx');
		const symbols = await service.getDocumentSymbols(uri);

		expect(symbol_name_kinds(symbols)).toEqual([
			['withFunction', SymbolKind.Constant],
			['withArrow', SymbolKind.Constant],
			['withComponent', SymbolKind.Constant],
		]);
		expect(child_names(symbols, 'withFunction')).toEqual(['insideFunction']);
		expect(child_names(symbols, 'withArrow')).toEqual(['insideArrow']);
		expect(child_names(symbols, 'withComponent')).toEqual(['insideComponent']);
	});

	it('returns symbols for class property and method members', async () => {
		const source = `class Store {
	value = 1;
	read() {
		return this.value;
	}
	'quoted'() {
		return 1;
	}
	['computed']() {
		return 2;
	}
}
`;

		const { service, uri } = create_symbol_harness(source, 'class-members.tsrx');
		const symbols = await service.getDocumentSymbols(uri);

		expect(child_names(symbols, 'Store')).toEqual(['value', 'read', 'quoted', 'computed']);
		expect(find_symbol(symbols, 'value')?.kind).toBe(SymbolKind.Property);
		expect(find_symbol(symbols, 'read')?.kind).toBe(SymbolKind.Method);
		expect(find_symbol(symbols, 'quoted')?.kind).toBe(SymbolKind.Method);
		expect(find_symbol(symbols, 'computed')?.kind).toBe(SymbolKind.Method);
	});
});

/**
 * @param {import('@volar/language-server').Range} outer
 * @param {import('@volar/language-server').Range} inner
 */
function range_contains(outer, inner) {
	return (
		compare_position(outer.start, inner.start) <= 0 && compare_position(inner.end, outer.end) <= 0
	);
}

/**
 * @param {import('@volar/language-server').Position} a
 * @param {import('@volar/language-server').Position} b
 */
function compare_position(a, b) {
	return a.line === b.line ? a.character - b.character : a.line - b.line;
}
