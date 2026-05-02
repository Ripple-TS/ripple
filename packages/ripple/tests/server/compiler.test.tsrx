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

		expect(result.js.code).toMatchSnapshot();
	});

	it('removes type assertions from function parameters and leaves default values', () => {
		const source = `
function getString(e: string = 'test') {
	return e;
}`;

		const result = compile(source, 'test.tsrx', { mode: 'server' });

		expect(result.js.code).toMatchSnapshot();
	});

	it('removes class TypeScript syntax from JS output', () => {
		const source = `interface BaseEvent {}

class PrintEvent implements BaseEvent {
	text: string;

	constructor(text: string) {
		this.text = text;
	}
}`;

		const result = compile(source, 'test.tsrx', { mode: 'server' });

		expect(result.js.code).not.toContain('implements');
		expect(result.js.code).toMatchSnapshot();
	});

	it('removes class extends type arguments from JS output', () => {
		const source = `class StringMap extends Map<string, string> {
	constructor() {
		super();
	}
}`;

		const result = compile(source, 'test.tsrx', { mode: 'server' });

		expect(result.js.code).not.toContain('Map<string, string>');
		expect(result.js.code).toContain('class StringMap extends Map');
		expect(result.js.code).toMatchSnapshot();
	});

	it('throws error for interpolating children as text in SSR mode', () => {
		const source = `
export component Layout({ children }) {
		<div>{children}</div>
}`;

		expect(() => compile(source, 'test.tsrx', { mode: 'server' })).not.toThrow();
	});

	it('throws error for interpolating props.children as text in SSR mode', () => {
		const source = `
export component Layout(props) {
	<div>{props.children}</div>
}`;

		expect(() => compile(source, 'test.tsrx', { mode: 'server' })).not.toThrow();
	});

	it('throws error for calling children as a function in SSR mode', () => {
		const source = `
export component Layout({ children }) {
	{children()}
}`;

		expect(() => compile(source, 'test.tsrx', { mode: 'server' })).toThrow(
			'`children` cannot be called like a regular function. Render it with `{children}` or `{props.children}` instead.',
		);
	});

	it('throws error for calling props.children as a function in SSR mode', () => {
		const source = `
export component Layout(props) {
	{props.children()}
}`;

		expect(() => compile(source, 'test.tsrx', { mode: 'server' })).toThrow(
			'`children` cannot be called like a regular function. Render it with `{children}` or `{props.children}` instead.',
		);
	});

	it('merges explicit children prop with implicit children in SSR output', () => {
		const source = `
component Card(props) {
	<div>{props.children}</div>
}

export component App() {
	const fallback = 'fallback';

	<Card children={fallback}>
		<span>{'content'}</span>
	</Card>
}
`;

		const result = compile(source, 'test.tsrx', { mode: 'server' }).js.code;

		// Template children should take precedence - explicit children prop should be removed
		expect((result.match(/children:/g) || []).length).toBe(1);
		expect(result).toContain('children: _$_.tsrx_element(');
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
		expect(result.js.code).toMatchSnapshot();
	});

	it('compiles imports from module server as server-call wrappers', () => {
		const source = `
module server {
	export async function loadUser(id) {
		return { id };
	}
}

import { loadUser as getUser } from server;

export component App() {
	const user = getUser('1');
	<div>{user.id}</div>
}`;

		const result = compile(source, 'test.tsrx', { mode: 'server' });
		expect(result.js.code).toContain('const getUser = function (...args)');
		expect(result.js.code).toContain('return _$_server_$_.loadUser(...args)');
		expect(result.js.code).toContain('export const _$_server_$_');
	});

	it('throws when server exports are used through direct member access', () => {
		const source = `
module server {
	export async function loadUser() {}
}

server.loadUser();`;

		expect(() => compile(source, 'test.tsrx', { mode: 'server' })).toThrowError(
			/Import server exports/,
		);
	});

	it('throws error for unsupported exported object pattern in server module', () => {
		const source = `
module server {
		const obj = { fn1: () => {}, fn2: () => {} };

		export const { fn1, fn2 } = obj;
}`;

		expect(() => compile(source, 'test.tsrx', { mode: 'server' })).toThrowError();
	});

	it('throws error for unsupported exported array pattern in server module', () => {
		const source = `
module server {
		const arr = [() => {}, () => {}];

		export const [fnarr1, fnarr2] = arr;
}`;

		expect(() => compile(source, 'test.tsrx', { mode: 'server' })).toThrowError();
	});

	it('throws error for unsupported exported member expression via object in server module', () => {
		const source = `
module server {
		const obj = { fn1: () => {}, fn2: () => {} };

		export const objProp = obj.fn1;
}`;

		expect(() => compile(source, 'test.tsrx', { mode: 'server' })).toThrowError();
	});

	it('throws error for unsupported exported member expression via array in server module', () => {
		const source = `
module server {
		const arr = [() => {}, () => {}];

		export const arrIndex0 = arr[0];
}`;

		expect(() => compile(source, 'test.tsrx', { mode: 'server' })).toThrowError();
	});

	it('wraps children in normalize_children for explicit children prop passed to component', () => {
		const source = `
component Card(props) {
	<div>{props.children}</div>
}

export component App() {
	const content = 'hello';

	<Card children={content} />
}
`;

		const result = compile(source, 'test.tsrx', { mode: 'server' }).js.code;

		expect(result).toContain('_$_.normalize_children(');
	});

	it('passes spread through to component when spread may contain children', () => {
		const source = `
component Card(props) {
	<div>{props.children}</div>
}

export component App() {
	const props = { children: 'hello' };

	<Card {...props} />
}
`;

		const result = compile(source, 'test.tsrx', { mode: 'server' }).js.code;

		expect(result).toContain('...props');
	});
});
