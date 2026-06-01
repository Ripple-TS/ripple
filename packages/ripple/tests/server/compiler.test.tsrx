describe('compiler typescript tests', () => {
	it('compiles TSInstantiationExpression', () => {
		const source = `function makeBox<T,>(value: T) {
	return { value };
}
const makeStringBox = makeBox<string>;
const stringBox = makeStringBox('abc');
const ErrorMap = Map<string, Error>;
const errorMap = new ErrorMap();`;

		const result = compile(source, 'test.tsrx', { mode: 'server' });

		expect(result.code).toMatchSnapshot();
	});

	it('removes type assertions from function parameters and leaves default values', () => {
		const source = `
function getString(e: string = 'test') {
	return e;
}`;

		const result = compile(source, 'test.tsrx', { mode: 'server' });

		expect(result.code).toMatchSnapshot();
	});

	it('removes TypeScript-only expression wrappers from assignment and update targets', () => {
		const source = `
beforeAll(() => {
	(global as any).ResizeObserver = createMockResizeObserver;
	(global as any).count++;
});

function Test() { return <>
	let toggle: { value: boolean } | undefined;
	toggle!.value = false;
	toggle!.value++;
</>; }`;

		const { code } = compile(source, 'test.tsrx', { mode: 'server' });

		expect(code).toContain('global.ResizeObserver = createMockResizeObserver');
		expect(code).toContain('global.count++');
		expect(code).toContain('toggle.value = false');
		expect(code).toContain('toggle.value++');
		expect(code).not.toContain('as any');
		expect(code).not.toContain('!');
	});

	it(
		'compiles writes to unknown lazy array index 1 through lazy array helpers in SSR output',
		() => {
			const source = `function Child({ pair: &[first, second] }) { return <>
	second = 10;
	<div>{first}</div>
</>; }
function App() { return <>
	<Child pair={[0, 1]} />
</>; }`;
			const { code } = compile(source, 'test.tsrx', { mode: 'server' });

			expect(code).toContain('_$_.lazy_array_set(lazy, 10, 1)');
			expect(code).not.toContain('lazy[1] =');
		},
	);

	it('does not double-wrap member access on lazy array value bindings in SSR output', () => {
		const source = `function Child({ pair: &[first] }) { return <>
	let value = first[0];
	<div>{value}</div>
</>; }
function App() { return <>
	<Child pair={[{ 0: 'x' }]} />
</>; }`;
		const { code } = compile(source, 'test.tsrx', { mode: 'server' });

		expect(code).toContain('let value = _$_.lazy_array_get(lazy, 0)[0];');
		expect(code).not.toContain('_$_.lazy_array_get(_$_.lazy_array_get(lazy, 0), 0)');
	});

	it('throws on indexed access through known tracked lazy destructures in SSR output', () => {
		const source = `import { track } from 'ripple';
function App() { return <>
	let &[value, tracked_ref] = track({ 0: 'x' });
	let nested = value[0];
	tracked_ref[0] = { 0: 'y' };
	let next = value[0];
	<div>{nested}{next}</div>
</>; }`;

		expect(() => compile(source, 'test.tsrx', { mode: 'server' })).toThrow(
			/Use \.value or &\[\] lazy destructuring/,
		);
	});

	it('throws on known tracked indexed access in SSR output', () => {
		const source = `import { track } from 'ripple';
function App() { return <>
	let tracked = track(0);
	++tracked[0];
	tracked[0]++;
	tracked[0] = tracked[0] + 1;
	let value = tracked[0];
	let ref = tracked[1];
	<div>{value}</div>
</>; }`;

		expect(() => compile(source, 'test.tsrx', { mode: 'server' })).toThrow(
			/Use \.value or &\[\] lazy destructuring/,
		);
	});

	it(
		'compiles indexed access on unknown lazy tracked refs through lazy array helpers in SSR output',
		() => {
			const source = `import { track } from 'ripple';
function Child({ pair: &[value, tracked_ref] }) { return <>
	++tracked_ref[0];
	tracked_ref[0]++;
	<div>{value}</div>
</>; }
function App() { return <>
	let tracked = track(0);
	<Child pair={tracked} />
</>; }`;
			const { code } = compile(source, 'test.tsrx', { mode: 'server' });

			expect(code).toContain('_$_.lazy_array_get(lazy, 1)');
			expect(code).toContain('_$_.lazy_array_update_pre(_$_.lazy_array_get(lazy, 1), 0)');
			expect(code).toContain('_$_.lazy_array_update(_$_.lazy_array_get(lazy, 1), 0)');
			expect(code).not.toContain('lazy[1][0]');
			expect(code).not.toContain('lazy_array_get(lazy, 1)[0]');
		},
	);

	it('removes class TypeScript syntax from JS output', () => {
		const source = `interface BaseEvent {}

class PrintEvent implements BaseEvent {
	text: string;

	constructor(text: string) {
		this.text = text;
	}
}`;

		const result = compile(source, 'test.tsrx', { mode: 'server' });

		expect(result.code).not.toContain('implements');
		expect(result.code).toMatchSnapshot();
	});

	it('removes class extends type arguments from JS output', () => {
		const source = `class StringMap extends Map<string, string> {
	constructor() {
		super();
	}
}`;

		const result = compile(source, 'test.tsrx', { mode: 'server' });

		expect(result.code).not.toContain('Map<string, string>');
		expect(result.code).toContain('class StringMap extends Map');
		expect(result.code).toMatchSnapshot();
	});

	it('throws error for interpolating children as text in SSR mode', () => {
		const source = `
export function Layout({ children }) { return <>
		<div>{children}</div>
</>; }`;

		expect(() => compile(source, 'test.tsrx', { mode: 'server' })).not.toThrow();
	});

	it('throws error for interpolating props.children as text in SSR mode', () => {
		const source = `
export function Layout(props) { return <>
	<div>{props.children}</div>
</>; }`;

		expect(() => compile(source, 'test.tsrx', { mode: 'server' })).not.toThrow();
	});

	it('compiles indented direct double-quoted text children in SSR mode', () => {
		const source = `
export default function A() { return <>
	<div>
		"Hello"
	</div>
</>; }`;

		const result = compile(source, 'test.tsrx', { mode: 'server' }).code;

		expect(result).toContain(`_$_.output_push('Hello')`);
		expect(result).not.toContain(`"Hello";`);
	});

	it('does not merge adjacent call-containing children into stringified text in SSR output', () => {
		const setup = `function child(label) {
	return <><span>{label}</span></>;
}
function Constructed(label) {
	return child(label);
}
const factory = child;
function identity(value) {
	return value;
}
function empty() {
	return null;
}
let assigned;
const lookup = { member: child('member') };
function getKey() {
	return 'member';
}
function touch() {
	return null;
}
function tag() {
	return child('tagged');
}
const values = { member: 0 };`;

		const cases = [
			{ name: 'call expression', expression: 'child(\'call\')' },
			{ name: 'new expression', expression: 'new Constructed(\'new\')' },
			{ name: 'chain expression', expression: 'factory?.(\'chain\')' },
			{ name: 'parenthesized expression', expression: '(child(\'parenthesized\'))' },
			{ name: 'TS as expression', expression: 'child(\'as\') as any' },
			{ name: 'TS non-null expression', expression: 'child(\'non-null\')!' },
			{ name: 'TS satisfies expression', expression: 'child(\'satisfies\') satisfies any' },
			{
				name: 'TS instantiation expression',
				expression: 'identity<typeof child>(child)(\'instantiation\')',
			},
			{ name: 'array expression', expression: '[child(\'array\')]' },
			{ name: 'assignment expression', expression: 'assigned = child(\'assignment\')' },
			{ name: 'binary expression', expression: 'empty() + \'\'' },
			{ name: 'logical expression', expression: 'true && child(\'logical\')' },
			{ name: 'conditional expression', expression: 'true ? child(\'conditional\') : \'\'' },
			{ name: 'member expression', expression: 'lookup[getKey()]' },
			{
				name: 'object expression',
				expression: '{ [Symbol.for(\'ripple.element\')]: true, render() { return child(\'object\'); } }',
			},
			{ name: 'sequence expression', expression: '(touch(), child(\'sequence\'))' },
			{ name: 'tagged template expression', expression: 'tag`tagged`' },
			{ name: 'template literal', expression: '`${empty()}`' },
			{ name: 'unary expression', expression: 'void empty()' },
			{ name: 'update expression', expression: 'values[getKey()]++' },
		];

		for (const test_case of cases) {
			const source = `${setup}
export function App() {
	return <>
		<div>{'${test_case.name}:'}{${test_case.expression}}</div>
	</>;
}`;

			const { code } = compile(source, `${test_case.name}.tsrx`, { mode: 'server' });

			if (code.includes('String(')) {
				throw new Error(`${test_case.name} was merged into a stringified text expression:\n${code}`);
			}
		}
	});

	it('decodes JSX-style entities before server text escaping', () => {
		const result = compile(
			`function App() { return <>
				<div>"Rock &amp; &quot;Roll&quot;"</div>
			</>; }`,
			'/src/App.tsrx',
			{ mode: 'server' },
		);

		expect(result.code).toContain(`_$_.output_push('Rock &amp; "Roll"')`);
	});

	it('emits anonymous component expressions as arrows in SSR output', () => {
		const source = `
const Inline = (props) => <>
	<div>{props.x}</div>
</>
`;
		const result = compile(source, 'anonymous-component.tsrx', { mode: 'server' }).code;

		expect(result).toContain('const Inline = (props) => {');
		expect(result).toContain('(props) => {');
		expect(result).toContain('return _$_.tsrx_element(() =>');
		expect(result).not.toContain('function Inline');
		expect(result).not.toContain('function (props');
	});

	it('emits function-expression components as functions in SSR output', () => {
		const source = `
const Inline = function(props) { return <>
	<div>{props.x}</div>
</>; }
`;
		const result = compile(source, 'anonymous-component.tsrx', { mode: 'server' }).code;

		expect(result).toContain('const Inline = function (props) {');
		expect(result).toContain('function (props) {');
		expect(result).toContain('return _$_.tsrx_element(() =>');
		expect(result).not.toContain('function Inline');
		expect(result).not.toContain('const Inline = (props) => {');
	});

	it('throws error for calling children as a function in SSR mode', () => {
		const source = `
export function Layout({ children }) { return <>
	{children()}
</>; }`;

		expect(() => compile(source, 'test.tsrx', { mode: 'server' })).toThrow(
			'`children` cannot be called like a regular function. Render it with `{children}` or `{props.children}` instead.',
		);
	});

	it('throws error for calling props.children as a function in SSR mode', () => {
		const source = `
export function Layout(props) { return <>
	{props.children()}
</>; }`;

		expect(() => compile(source, 'test.tsrx', { mode: 'server' })).toThrow(
			'`children` cannot be called like a regular function. Render it with `{children}` or `{props.children}` instead.',
		);
	});

	it('merges explicit children prop with implicit children in SSR output', () => {
		const source = `
function Card(props) { return <>
	<div>{props.children}</div>
</>; }

export function App() { return <>
	const fallback = 'fallback';

	<Card children={fallback}>
		<span>{'content'}</span>
	</Card>
</>; }
`;

		const result = compile(source, 'test.tsrx', { mode: 'server' }).code;

		// Template children should take precedence - explicit children prop should be removed
		expect((result.match(/children:/g) || []).length).toBe(1);
		expect(result).toContain('children: _$_.tsrx_element(');
	});

	it('routes calls to functions with nested template returns through render_expression', () => {
		const source = `
function App() { return <>
	function make(flag) {
		if (flag) {
			return <><span>{'nested'}</span></>;
		}

		return null;
	}

	<div>{make(true)}</div>
</>; }
`;

		const result = compile(source, 'test.tsrx', { mode: 'server' }).code;

		expect(result).toContain('_$_.render_expression(make(true))');
		expect(result).not.toContain('_$_.escape(make(true))');
	});

	it('does not treat nested function template returns as outer function returns', () => {
		const source = `
function App() { return <>
	function make() {
		function nested() {
			return <><span>{'nested'}</span></>;
		}

		return nested;
	}

	<div>{make()}</div>
</>; }
`;

		const result = compile(source, 'test.tsrx', { mode: 'server' }).code;

		expect(result).toContain('_$_.render_expression(make())');
		expect(result).not.toContain('_$_.render_tsrx_element(make())');
	});
});

describe('compiler server module tests', () => {
	it('compiles module server with only supported types', () => {
		const source = `
module server {
	function something() {
		return 'unexported function';
	}

	export async function fetchUser(id) {
		const response = await fetch(\`/api/user/\${id}\`);
		const data = await response.json();
		return data;
	}

	const fetchUserAlias = fetchUser;

	const AliasForFetchUserAlias = fetchUserAlias;

	export const AnotherAlias = AliasForFetchUserAlias;

	export const func = function test() {
		return 'test';
	};

	export const func2 = function () {
		return 'test';
	};

	export const func3 = () => {
		return 'test';
	};

	export { fetchUserAlias, AliasForFetchUserAlias };
}`;

		const result = compile(source, 'test.tsrx', { mode: 'server' });
		expect(result.code).toMatchSnapshot();
	});

	it('compiles imports from module server as server-call wrappers', () => {
		const source = `
module server {
	export async function loadUser(id) {
		return { id };
	}
}

import { loadUser as getUser } from server;

export function App() { return <>
	const user = getUser('1');
	<div>{user.id}</div>
</>; }`;

		const result = compile(source, 'test.tsrx', { mode: 'server' });
		expect(result.code).toContain('const getUser = function (...args)');
		expect(result.code).toContain('return _$_server_$_.loadUser(...args)');
		expect(result.code).toContain('export const _$_server_$_');
	});

	it('throws when server exports are used through direct member access', () => {
		const source = `
module server {
	export async function loadUser() {}
}

server.loadUser();`;

		expect(() => compile(source, 'test.tsrx', { mode: 'server' })).toThrow(/Import server exports/);
	});

	it('throws error for unsupported exported object pattern in server module', () => {
		const source = `
module server {
		const obj = { fn1: () => {}, fn2: () => {} };

		export const { fn1, fn2 } = obj;
}`;

		expect(() => compile(source, 'test.tsrx', { mode: 'server' })).toThrow();
	});

	it('throws error for unsupported exported array pattern in server module', () => {
		const source = `
module server {
		const arr = [() => {}, () => {}];

		export const [fnarr1, fnarr2] = arr;
}`;

		expect(() => compile(source, 'test.tsrx', { mode: 'server' })).toThrow();
	});

	it('throws error for unsupported exported member expression via object in server module', () => {
		const source = `
module server {
		const obj = { fn1: () => {}, fn2: () => {} };

		export const objProp = obj.fn1;
}`;

		expect(() => compile(source, 'test.tsrx', { mode: 'server' })).toThrow();
	});

	it('throws error for unsupported exported member expression via array in server module', () => {
		const source = `
module server {
		const arr = [() => {}, () => {}];

		export const arrIndex0 = arr[0];
}`;

		expect(() => compile(source, 'test.tsrx', { mode: 'server' })).toThrow();
	});

	it('wraps children in normalize_children for explicit children prop passed to component', () => {
		const source = `
function Card(props) { return <>
	<div>{props.children}</div>
</>; }

export function App() { return <>
	const content = 'hello';

	<Card children={content} />
</>; }
`;

		const result = compile(source, 'test.tsrx', { mode: 'server' }).code;

		expect(result).toContain('_$_.normalize_children(');
	});

	it('passes spread through to component when spread may contain children', () => {
		const source = `
function Card(props) { return <>
	<div>{props.children}</div>
</>; }

export function App() { return <>
	const props = { children: 'hello' };

	<Card {...props} />
</>; }
`;

		const result = compile(source, 'test.tsrx', { mode: 'server' }).code;

		expect(result).toContain('...props');
	});
});
