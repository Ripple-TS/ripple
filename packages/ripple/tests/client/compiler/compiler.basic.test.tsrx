import { parse, compile, compile_to_volar_mappings } from '@tsrx/ripple';
import { DIAGNOSTIC_CODES } from '@tsrx/core';
import type * as AST from 'estree';
import type * as ESTreeJSX from 'estree-jsx';

function count_occurrences(string: string, subString: string): number {
	let count = 0;
	let pos = string.indexOf(subString);

	while (pos !== -1) {
		count++;
		pos = string.indexOf(subString, pos + subString.length);
	}

	return count;
}

describe('compiler > basics', () => {
	it('parses style content correctly', () => {
		const source = `export component App() {
  <div id="myid" class="myclass">{"Hello World"}</div>

  <style>__STYLE__</style>
}`;
		const style1 = '.myid {color: green }';
		const style2 = '#myid {color: green }';
		const style3 = 'div {color: green }';

		let input = source.replace('__STYLE__', style1);
		let ast = parse(input);
		expect(
			((ast.body[0] as AST.ExportNamedDeclaration).declaration as unknown as AST.Component)?.css.source,
		).toEqual(style1);

		input = source.replace('__STYLE__', style2);
		ast = parse(input);
		expect(
			((ast.body[0] as AST.ExportNamedDeclaration).declaration as unknown as AST.Component)?.css.source,
		).toEqual(style2);

		input = source.replace('__STYLE__', style3);
		ast = parse(input);
		expect(
			((ast.body[0] as AST.ExportNamedDeclaration).declaration as unknown as AST.Component)?.css.source,
		).toEqual(style3);
	});

	it('parses explicit text interpolation and reserves the text keyword', () => {
		const source = `export component App() {
	const markup = '<span>Not HTML</span>';

	<div>{markup}</div>
	<div>{text markup}</div>
}`;

		const ast = parse(source);
		const component_node = (ast.body[0] as AST.ExportNamedDeclaration).declaration as unknown as AST.Component;
		const elements = component_node.body.filter((node) => node.type === 'Element') as AST.Element[];
		const expression = elements[0].children[0] as AST.Node & { expression: AST.Expression };
		const explicit_text = elements[1].children[0] as AST.TextNode;

		expect(elements).toHaveLength(2);
		expect(expression.type).toBe('TSRXExpression');
		expect((expression.expression as AST.Identifier).name).toBe('markup');
		expect(explicit_text.type).toBe('Text');
		expect((explicit_text.expression as AST.Identifier).name).toBe('markup');

		const { js } = compile(source, 'text-directive.tsrx', { mode: 'client' });
		expect(js.code).not.toContain('_$_.html');

		const invalid_source = `export component App() {
	const text = 'plain';

	<div>{text}</div>
}`;

		expect(() => parse(invalid_source)).toThrow(
			'"text" is a TSRX keyword and must be used in the form {text some_value}',
		);
	});

	it('parses backtick text inside fragments as JSX text', () => {
		const source = `let a = component () {
			<>
				\`333\`
			</>
		}`;

		const ast = parse(source);
		const declaration = (ast.body[0] as AST.VariableDeclaration).declarations[0];
		const component_node = declaration.init as unknown as AST.Component;
		const fragment = component_node.body[0] as any;

		expect(fragment.type).toBe('Tsx');
		expect(fragment.children[0].type).toBe('JSXText');
		expect(fragment.children[0].value).toContain('`333`');
	});

	it('parses backtick text around JSX elements inside fragments', () => {
		const source = `let a = component () {
			<>
				\`
				<b></b>
				\`
			</>
		}`;

		const ast = parse(source);
		const declaration = (ast.body[0] as AST.VariableDeclaration).declarations[0];
		const component_node = declaration.init as unknown as AST.Component;
		const fragment = component_node.body[0] as any;

		expect(fragment.type).toBe('Tsx');
		expect(fragment.children.map((child: any) => child.type)).toEqual([
			'JSXText',
			'JSXElement',
			'JSXText',
		]);
		expect(fragment.children[0].value).toContain('`');
		expect(fragment.children[1].openingElement.name.name).toBe('b');
		expect(fragment.children[2].value).toContain('`');
	});

	it('renders without crashing', () => {
		component App() {
			let foo: Record<string, number>;
			let bar: Record<string, number>;
			let baz: Record<string, number>;

			foo = {};
			foo = { test: 0 };
			foo['abc'] = 123;

			bar = { def: 456 };

			baz = { ghi: 789 };
			baz['jkl'] = 987;
		}

		render(App);
	});

	it('renders without crashing using < character', () => {
		component App() {
			function bar() {
				for (let i = 0; i < 10; i++) {
					// do nothing
				}
				const x = 1 < 1;
			}

			let x = 5 < 10;

			<div>{x}</div>
		}

		render(App);
	});

	it('renders lexical blocks without crashing', () => {
		component App() {
			<div>
				const a = 1;
				<div>
					const b = 1;
				</div>
				<div>
					const b = 1;
				</div>
			</div>
			<div>
				const a = 2;
				<div>
					const b = 1;
				</div>
			</div>
		}

		render(App);
	});

	it('renders without crashing using mapped types', () => {
		component App() {
			type RecordKey = 'test';
			type RecordValue = { a: string; b: number };

			const config: Record<RecordKey, RecordValue> = {
				test: {
					a: 'test',
					b: 1,
				},
			};

			const config2: { [key in RecordKey]: RecordValue } = {
				test: {
					a: 'test2',
					b: 2,
				},
			};

			const config3: { [key: string]: RecordValue } = {
				test: {
					a: 'test3',
					b: 3,
				},
			};
		}

		render(App);
	});

	it('renders without crashing using object destructuring', () => {
		component App() {
			const obj = { a: 1, b: 2, c: 3 };
			const { a, b, ...rest } = obj;

			<div>
				{'a '}
				{a}
				{'b '}
				{b}
				{'rest '}
				{JSON.stringify(rest)}

				<div />
			</div>
		}

		render(App);
	});

	it('renders without crashing using object destructuring #2', () => {
		component App() {
			const obj = { a: 1, b: 2, c: 3 };
			const { a, b, ...rest } = obj;

			{'a '}
			{a}
			{'b '}
			{b}
			{'rest '}
			{JSON.stringify(rest)}

			<div />
		}

		render(App);
	});

	it('should not fail with random TS syntax', () => {
		function tagFn(template: TemplateStringsArray) {
			return null;
		}

		function Wrapper<T>() {
			return {
				unwrap: function <T>() {
					return null as unknown as T;
				},
			};
		}

		component App() {
			let x: number[] = [] as number[];

			const n = Wrapper<number>().unwrap<string>();

			const tagResult = tagFn`value`;

			interface Node<T> {
				value: T;
			}

			class Box<T> {
				value: T;

				method<U extends T>(): U {
					return this.value as U;
				}

				constructor(value: T) {
					this.value = value;
				}
			}

			let flag = true;

			const s = flag ? new Box<number>(1) : new Box<string>('string');
		}

		render(App);
	});

	it('compiles without needing semicolons between statements and JSX', () => {
		const source = `export component App() {
	<div>const code4 = 4

	const code3 = 3
		<div>
			<div>
				const code = 1
			</div>
			const code2 = 2
		</div>
	</div>
}`;

		const result = compile(source, 'test.tsrx', { mode: 'client' });
	});

	it('calculates fragment hop count after return-guard grouping', () => {
		const source = `export component App() {
	let stop = false;
	if (stop) {
		return;
	}
	<div class="a">{'a'}</div>
	<div class="b">{'b'}</div>
}`;

		const { js } = compile(source, 'grouped-count.tsrx', { mode: 'client' });

		expect(js.code).toMatch(/_\$_\.template\(`<!><!>`,\s*1,\s*2\)/);
		expect(js.code).not.toMatch(/_\$_\.template\(`<!><!>`,\s*1,\s*3\)/);
	});

	it('emits anonymous component expressions as arrows in client output', () => {
		const source = `
const Inline = component(props) => {
	<div>{props.x}</div>
}
`;
		const result = compile(source, 'anonymous-component.tsrx', { mode: 'client' }).js.code;

		expect(result).toContain('const Inline = (__anchor, props, __block) => {');
		expect(result).not.toContain('function Inline');
		expect(result).not.toContain('function (__anchor');
	});

	it('emits legacy anonymous component expressions as functions in client output', () => {
		const source = `
const Inline = component(props) {
	<div>{props.x}</div>
}
`;
		const result = compile(source, 'anonymous-component.tsrx', { mode: 'client' }).js.code;

		expect(result).toContain('const Inline = function (__anchor, props, __block) {');
		expect(result).not.toContain('function Inline');
		expect(result).not.toContain('const Inline = (__anchor, props, __block) => {');
	});

	// 	it(
	// 		'imports and uses only obfuscated Tracked imports when encountering only shorthand syntax',
	// 		() => {
	// 			const source = `
	// import { RippleArray, RippleObject, RippleSet, RippleMap, createRefKey } from 'ripple';
	// component App() {
	// 	const items = new RippleArray(1, 2, 3);
	// 	const obj = new RippleObject({ a: 1, b: 2, c: 3 });
	// 	const set = RippleSet([1, 2, 3]);
	// 	const map = RippleMap([['a', 1], ['b', 2], ['c', 3]]);

	// 	<div {ref () => {}} />
	// }
	// `;
	// 			const result = compile_to_volar_mappings(source, 'test.tsrx').code;

	// 			expect(count_occurrences(result, 'RippleArray')).toBe(1);
	// 			expect(count_occurrences(result, 'RippleObject')).toBe(1);
	// 			expect(count_occurrences(result, 'RippleSet')).toBe(1);
	// 			expect(count_occurrences(result, 'RippleMap')).toBe(1);
	// 			expect(count_occurrences(result, 'createRefKey')).toBe(1);
	// 		},
	// 	);

	// 	it(
	// 		'adds obfuscated imports and keeps renamed Tracked imports intact when encountering shorthand syntax',
	// 		() => {
	// 			const source = `
	// import { RippleArray as TA, RippleObject as TO, RippleSet as TS, RippleMap as TM, createRefKey as crk } from 'ripple';
	// component App() {
	// 	const items = new RippleArray(1, 2, 3);
	// 	const obj = new RippleObject({ a: 1, b: 2, c: 3 });
	// 	const set = RippleSet([1, 2, 3]);
	// 	const map = RippleMap([['a', 1], ['b', 2], ['c', 3]]);

	// 	<div {ref () => {}} />
	// }
	// `;
	// 			const result = compile_to_volar_mappings(source, 'test.tsrx').code;

	// 			expect(count_occurrences(result, obfuscateIdentifier('RippleArray'))).toBe(2);
	// 			expect(count_occurrences(result, 'TA')).toBe(1);
	// 			expect(count_occurrences(result, obfuscateIdentifier('RippleObject'))).toBe(2);
	// 			expect(count_occurrences(result, 'TO')).toBe(1);
	// 			expect(count_occurrences(result, obfuscateIdentifier('RippleSet'))).toBe(2);
	// 			expect(count_occurrences(result, 'TS')).toBe(1);
	// 			expect(count_occurrences(result, obfuscateIdentifier('RippleMap'))).toBe(2);
	// 			expect(count_occurrences(result, 'TM')).toBe(1);
	// 			expect(count_occurrences(result, obfuscateIdentifier('createRefKey'))).toBe(2);
	// 			expect(count_occurrences(result, 'crk')).toBe(1);
	// 		},
	// 	);

	// 	it('adds hidden obfuscated imports for shorthand syntax', () => {
	// 		const source = `
	// component App() {
	// 	const items = new RippleArray(1, 2, 3);
	// 	const obj = new RippleObject({ a: 1, b: 2, c: 3 });
	// 	const set = RippleSet([1, 2, 3]);
	// 	const map = RippleMap([['a', 1], ['b', 2], ['c', 3]]);

	// 	<div {ref () => {}} />
	// }
	// `;
	// 		const result = compile_to_volar_mappings(source, 'test.tsrx').code;

	// 		expect(count_occurrences(result, obfuscateIdentifier('RippleArray'))).toBe(2);
	// 		expect(count_occurrences(result, obfuscateIdentifier('RippleObject'))).toBe(2);
	// 		expect(count_occurrences(result, obfuscateIdentifier('RippleSet'))).toBe(2);
	// 		expect(count_occurrences(result, obfuscateIdentifier('RippleMap'))).toBe(2);
	// 		expect(count_occurrences(result, obfuscateIdentifier('createRefKey'))).toBe(2);
	// 	});

	it('prints longhand tracked property values in to_ts output while preserving [\'#v\']', () => {
		const source = `
import { RippleArray, RippleMap, RippleObject, RippleSet, createRefKey, effect, track, untrack } from 'ripple';
component App() {
    let value = track('test');
    function inputRef(node) {}

    const props = {
            id: 'example',
            value: value.value,
            [createRefKey()]: inputRef,
    };
}
`;

		const result = compile_to_volar_mappings(source, 'test.tsrx').code;

		expect(result).toMatch(/value:\s*value\.value/);
	});

	it('keeps lazy destructuring as plain destructuring in to_ts output', () => {
		const track_source = `
import { track } from 'ripple';
component App() {
	let &[value, ...rest] = track(0);
	const x = value;
}
`;
		const track_result = compile_to_volar_mappings(track_source, 'test.tsrx').code;
		expect(track_result).toContain('let [value, ...rest] = track(0);');
		expect(track_result).toContain('const x = value;');
		expect(track_result).not.toContain('let lazy = track(0)');
		expect(track_result).not.toContain('.slice(');
		expect(track_result).not.toContain('_$_.get(');
		expect(track_result).not.toContain('lazy0');
	});

	it('preserves optional markers in to_ts TypeScript output', () => {
		const source = `
export type OptionalTuple = [bar: string, baz?: string];
export type OptionalFn = (bar: string, baz?: string) => void;
export interface OptionalInterfaceFn {
	(bar: string, baz?: string): void;
}
export function optionalFn(bar: string, baz?: string) {
	todo(bar, baz);
}
`;
		const result = compile_to_volar_mappings(source, 'test.tsrx').code;

		expect(result).toContain('export type OptionalTuple = [bar: string, baz?: string];');
		expect(result).toContain('export type OptionalFn = (bar: string, baz?: string) => void;');
		expect(result).toContain('(bar: string, baz?: string): void');
		expect(result).toContain('export function optionalFn(bar: string, baz?: string)');
	});

	it('preserves component type parameters in to_ts output', () => {
		const source = `
type Props<Item> = {
	items: readonly Item[];
}

export component MyComponent<Item>(props: Props<Item>) {
	<div />
}
`;
		const result = compile_to_volar_mappings(source, 'test.tsrx').code;

		expect(result).toContain('export function MyComponent<Item>(props: Props<Item>)');
	});

	it('emits anonymous component expressions as arrows in to_ts output', () => {
		const source = `
const Inline = component(props: { x: string }) => {
	<div>{props.x}</div>
}
`;
		const result = compile_to_volar_mappings(source, 'test.tsrx').code;

		expect(result).toContain('const Inline = (props: { x: string }) => {');
		expect(result).not.toContain('function Inline');
		expect(result).not.toContain('function (props');
	});

	it('emits legacy anonymous component expressions as functions in to_ts output', () => {
		const source = `
const Inline = component(props: { x: string }) {
	<div>{props.x}</div>
}
`;
		const result = compile_to_volar_mappings(source, 'test.tsrx').code;

		expect(result).toContain('const Inline = function(props: { x: string }) {');
		expect(result).not.toContain('function Inline');
		expect(result).not.toContain('const Inline = (props: { x: string }) => {');
	});

	it('preserves generic type arguments on JSX component tags in to_ts output', () => {
		const source = `
type User = { name: string };

component RenderProp<Item>(props: { children: (item: Item) => any }) {}

export component App() {
	<RenderProp<User>>
		{(item) => item.name}
	</RenderProp>
}
`;
		const result = compile_to_volar_mappings(source, 'test.tsrx').code;

		expect(result).toContain('<RenderProp<User>');
	});

	it('preserves generic type arguments on self-closing JSX component tags in to_ts output', () => {
		const source = `
component Box<T>({ value }: { value: T }) {
	<div>{String(value)}</div>
}

export component App() {
	<Box<string> value="hi" />
}
`;
		const result = compile_to_volar_mappings(source, 'test.tsrx').code;

		expect(result).toContain('<Box<string>');
	});

	it('preserves regular function type parameters in to_ts output', () => {
		const source = `
type Props<Item> = {
	items: readonly Item[];
}

export function getItems<Item>(props: Props<Item>) {
	return props.items;
}
`;
		const result = compile_to_volar_mappings(source, 'test.tsrx').code;

		expect(result).toContain('export function getItems<Item>(props: Props<Item>)');
	});

	it('maps optional TypeScript identifiers in to_ts output', () => {
		const source = `
export type OptionalTuple = [tupleRequired: string, tupleMaybe?: string];
export type OptionalFn = (fnRequired: string, fnMaybe?: string) => void;
export function optionalFn(declRequired: string, declMaybe?: string) {
	todo(declRequired, declMaybe);
}
`;
		const result = compile_to_volar_mappings(source, 'test.tsrx');

		function expect_identifier_mapping(identifier: string, sourceNeedle: string) {
			const source_offset = source.indexOf(sourceNeedle);
			const generated_offset = result.code.indexOf(sourceNeedle);
			const mapping = result.mappings.find(
				(mapping: {
					sourceOffsets: number[];
					generatedOffsets: number[];
					lengths: number[];
					generatedLengths: number[];
				}) => mapping.sourceOffsets[0] === source_offset &&
					mapping.generatedOffsets[0] === generated_offset &&
					mapping.lengths[0] === identifier.length &&
					mapping.generatedLengths[0] === identifier.length,
			);

			expect(source_offset).toBeGreaterThan(-1);
			expect(generated_offset).toBeGreaterThan(-1);
			expect(mapping).toBeDefined();
		}

		expect(result.errors).toEqual([]);
		expect_identifier_mapping('tupleMaybe', 'tupleMaybe?: string');
		expect_identifier_mapping('fnMaybe', 'fnMaybe?: string');
		expect_identifier_mapping('declMaybe', 'declMaybe?: string');
	});

	it('uses tracked fast path for nested lazy params typed as Tracked', () => {
		const source = `
import type { Tracked } from 'ripple';
function use_nested({ value: &[count, tracked] }: { value: Tracked<number> }) {
	count++;
	return tracked;
}
`;
		const { js } = compile(source, 'tracked-nested-lazy.tsrx', { mode: 'client' });

		// Nested lazy array should still use tracked tuple fast path from outer annotation.
		expect(js.code).toContain('_$_.update(');
		expect(js.code).not.toContain('[0]');
		expect(js.code).not.toContain('[1]');
	});

	it('uses tracked fast path for nested lazy params at tuple rest positions', () => {
		const source = `
import type { Tracked } from 'ripple';
function use_tuple_rest({ value: [head, &[count, tracked]] }: { value: [number, ...Tracked<number>[]] }) {
	count++;
	return tracked;
}
`;
		const { js } = compile(source, 'tracked-nested-lazy-tuple-rest.tsrx', { mode: 'client' });

		// Tuple rest element access should resolve to Tracked<number>, not Tracked<number>[].
		expect(js.code).toContain('_$_.update(');
		expect(js.code).not.toContain('[1]');
	});

	it('preserves generic type args in interface extends for Volar mappings', () => {
		const source = `
interface PolymorphicProps<T extends keyof HTMLElementTagNameMap> {
	as?: T;
}

interface Props extends PolymorphicProps<'div'> {
	id: string;
}

export component App(props: Props) {
	<div id={props.id} />
}
`;

		const result = compile_to_volar_mappings(source, 'test.tsrx').code;

		expect(result).toContain('extends PolymorphicProps<\'div\'>');
	});

	it('handles if-else expression statements in Volar mappings', () => {
		const source = `
import { track } from 'ripple';
export component App() {
	let &[level] = track(1);

	<button
		onClick={() => {
			if (level === 1) level = 2;
			else if (level === 2) level = 3;
			else level = 1;
		}}
	>
		{'Toggle'}
	</button>
}
`;

		expect(() => compile_to_volar_mappings(source, 'test.tsrx')).not.toThrow();
	});

	it('should not error on having js below markup in the same scope', () => {
		const code = `
component Card(props) {
	<div class="card">
		{props.children}
	</div>
}

export component App() {
		component children() {
			<p>{'Card content here'}</p>
		}

		<Card {children} />

	const test = 5;

	<div>{test}</div>
}
`;
		expect(() => compile(code, 'test.tsrx')).not.toThrow();
	});

	it('allows component declarations inside composite children', () => {
		const source = `
export component App() {
	<ark.div class="host-class" data-value="42">
		component asChild({ children, href, ...rest }: { href: string; [key: string]: any }) {
			<a id="aschild-anchor" {href} {...rest} data-extra="yes">{'Link'}</a>
		}
	</ark.div>
}
`;

		expect(() => compile_to_volar_mappings(source, 'test.tsrx')).not.toThrow();
	});

	it('rejects parent element attributes referencing child-declared components', () => {
		const source = `
export component App() {
	<Test {Z}>
		component Z() {
			<div>{'hello'}</div>
		}
	</Test>
}
`;

		expect(() => compile(source, 'test.tsrx')).toThrow(
			/Cannot use component 'Z' as a prop on its parent element/,
		);
	});

	it('preserves explicit component props in Volar mappings', () => {
		const source = `
export component App() {
	component asChild({ children, href, ...rest }: { href: string; [key: string]: any }) {
		<a id="aschild-anchor" {href} {...rest} data-extra="yes">{'Link'}</a>
	}

	<ark.div class="host-class" data-value="42" {asChild} />
}
`;
		const result = compile_to_volar_mappings(source, 'test.tsrx').code;

		expect(result).toContain('<ark.div class="host-class" data-value="42" asChild={asChild}');
		expect(result).not.toContain('children={() =>');
	});

	it('merges explicit children prop with implicit children in client output', () => {
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

		const result = compile(source, 'test.tsrx', { mode: 'client' }).js.code;

		// Template children should take precedence - explicit children prop should be removed
		expect((result.match(/children:/g) || []).length).toBe(1);
		expect(result).toContain('children: _$_.tsrx_element(');
	});

	it('should not error on `this` MemberExpression with a UpdateExpression', () => {
		const code = `
class Test {
	constructor() {
		this.count = 0;
		this.count++; // This should not fail
	}
}

export component App() {
	const test = new Test();
	<div>{test.count}</div>
}
`;
		expect(() => compile(code, 'test.tsrx')).not.toThrow();
	});

	it('should inject __block for track() calls inside class constructors', () => {
		const source = `
import { track, RippleArray } from 'ripple';

class Store {
	constructor() {
		this.count = track(0);
		this.items = new RippleArray(1, 2, 3);
	}
}

export component App() {
	const store = new Store();
	<div>{store.count}</div>
}
`;
		const result = compile(source, 'test.tsrx', { mode: 'client' });
		const code = result.js.code;

		// The constructor's compiled output should contain __block = _$_.scope()
		expect(code).toContain('__block');
		expect(code).toContain('_$_.scope()');
	});

	it('parses effect and untrack calls', () => {
		const source = `
import { track, effect, untrack } from 'ripple';

component App() {
	let &[count] = track(0);

	effect(() => {
		const snapshot = untrack(() => count);
		console.log(snapshot);
	});
}
`;

		const ast = parse(source);
		const ast_json = JSON.stringify(ast);

		expect(ast_json).toContain('"name":"effect"');
		expect(ast_json).toContain('"name":"untrack"');
	});

	it('collects duplicate declaration parser errors in loose mode', () => {
		const source = `
import { track } from 'ripple';
export component App() {
	let test = track(false);
	let test = 'hey';
}
`;

		expect(() => compile(source, 'test.tsrx')).toThrow(
			'Identifier \'test\' has already been declared',
		);

		const result = compile_to_volar_mappings(source, 'test.tsrx', { loose: true });

		expect(
			result.errors.some(
				(item) => item.message.includes('Identifier \'test\' has already been declared'),
			),
		).toBe(true);
	});

	it('maps module server import identifiers in Volar output', () => {
		const source = `module server {
	export function loadUser() {
		return { id: '1' };
	}
}

import { loadUser as getUser } from server;
import { loadUser } from server;

component App() {
	const user = getUser();
	const user2 = loadUser();
	<div>{user.id}{user2.id}</div>
}`;
		const result = compile_to_volar_mappings(source, 'test.tsrx', { loose: true });
		const generated_member = '_$_server_$_.loadUser';
		const generated_member_offset = result.code.indexOf(generated_member);
		const generated_imported_offset = generated_member_offset + '_$_server_$_'.length + 1;
		const generated_local_offset = result.code.indexOf('const getUser') + 'const '.length;
		const generated_non_alias_member_offset =
			result.code.indexOf(generated_member, generated_member_offset + 1) + '_$_server_$_'.length +
			1;
		const generated_non_alias_local_offset =
			result.code.indexOf('const loadUser') + 'const '.length;
		const source_imported_offset = source.indexOf('loadUser as');
		const source_local_offset = source.indexOf('getUser }');
		const source_non_alias_offset = source.indexOf('loadUser }');
		const source_server_offset = source.indexOf('server;');

		function find_mapping(
			source_offset: number,
			generated_offset: number,
			length: number,
			generated_length = length,
		) {
			return result.mappings.find(
				(mapping) => mapping.sourceOffsets[0] === source_offset &&
					mapping.generatedOffsets[0] === generated_offset &&
					mapping.lengths[0] === length &&
					mapping.generatedLengths[0] === generated_length,
			);
		}

		expect(result.errors).toEqual([]);
		expect(result.code).toContain('const getUser = _$_server_$_.loadUser;');
		expect(result.code).toContain('const loadUser = _$_server_$_.loadUser;');
		expect(
			find_mapping(source_imported_offset, generated_imported_offset, 'loadUser'.length),
		).toBeDefined();
		expect(
			find_mapping(source_local_offset, generated_local_offset, 'getUser'.length),
		).toBeDefined();
		expect(
			find_mapping(source_non_alias_offset, generated_non_alias_local_offset, 'loadUser'.length),
		).toBeDefined();
		expect(
			find_mapping(source_non_alias_offset, generated_non_alias_member_offset, 'loadUser'.length),
		).toBeDefined();
		expect(
			find_mapping(
				source_server_offset,
				generated_member_offset,
				'server'.length,
				'_$_server_$_'.length,
			),
		).toBeDefined();
	});

	it('collects volar parser diagnostics outside loose mode', () => {
		const result = compile_to_volar_mappings(`component App() {
				return <div />;
			}`, 'test.tsrx');

		expect(result.errors.map((error) => error.code)).toContain(
			DIAGNOSTIC_CODES.JSX_RETURN_IN_COMPONENT,
		);
	});

	it('throws for unclosed tsx compat tags instead of hanging', () => {
		const source = `export component App() {
	<tsx:react>1
}`;

		expect(() => compile(source, 'test.tsrx')).toThrow(
			'Unclosed tag \'<tsx:react>\'. Expected \'</tsx:react>\' before end of component.',
		);
	});

	it('recovers unclosed tsx compat tags in loose mode', () => {
		const source = `export component App() {
	<tsx:react>1
}`;

		expect(() => compile_to_volar_mappings(source, 'test.tsrx', { loose: true })).not.toThrow();

		const result = compile_to_volar_mappings(source, 'test.tsrx', { loose: true });
		expect(result.errors).toEqual([]);
	});

	it('collects unclosed tsx compat tags outside loose mode', () => {
		const source = `export component App() {
	<tsx:react>1
}`;

		const result = compile(source, 'test.tsrx', { collect: true });
		expect(result.errors.map((error) => error.message)).toContain(
			'Unclosed tag \'<tsx:react>\'. Expected \'</tsx:react>\' before end of component.',
		);
	});

	it('collects analyzer errors outside loose mode', () => {
		const source = `
import { track } from 'ripple';

const outside = track(0);

export component App() {}
`;

		const result = compile(source, 'test.tsrx', { collect: true });
		expect(result.errors.map((error) => error.message)).toContain(
			'`track` can only be used within a reactive context, such as a component, function or class that is used or created from a component',
		);
	});

	it('does not let nested for...of continues satisfy an outer if body', () => {
		const source = `
export component App({ items }: { items: string[] }) {
	if (items.length) {
		for (const item of items) {
			if (!item) continue
		}
	}
}`;

		const result = compile(source, 'test.tsrx', { collect: true });
		expect(result.errors.map((error) => error.message)).toContain(
			'Component if statements must contain a template in their "then" body. Move the if statement into an effect if it does not render anything.',
		);
	});

	it('preserves class extends generic type arguments in volar output', () => {
		const source = `class StringMap extends Map<string, string> {}
export component App() {}`;

		expect(() => compile_to_volar_mappings(source, 'test.tsrx', { loose: true })).not.toThrow();

		const result = compile_to_volar_mappings(source, 'test.tsrx', { loose: true }).code;

		expect(result).toContain('class StringMap extends Map<string, string> {}');
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

		const result = compile(source, 'test.tsrx', { mode: 'client' }).js.code;

		expect(result).toContain('_$_.normalize_children(');
	});

	it(
		'parses a JS statement inside an element with no trailing whitespace before the closing tag',
		() => {
			const source = `component TodoList({ items }: { items: { text: string }[] }) {
  <ul>var a = "123"</ul>
}`;
			const ast = parse(source);
			const comp = ast.body[0] as unknown as AST.Component;
			const ul = comp.body.find((n) => n.type === 'Element') as AST.Element;
			expect((ul.id as AST.Identifier).name).toBe('ul');
			expect(ul.children).toHaveLength(1);
			const decl = ul.children[0] as unknown as AST.VariableDeclaration;
			expect(decl.type).toBe('VariableDeclaration');
			expect(decl.kind).toBe('var');
			expect((decl.declarations[0].id as AST.Identifier).name).toBe('a');
			expect((decl.declarations[0].init as AST.Literal).value).toBe('123');
			expect((ul.closingElement?.name as ESTreeJSX.JSXIdentifier)?.name).toBe('ul');
		},
	);

	it('uses spread_props for spreads that may contain children', () => {
		const source = `
component Card(props) {
	<div>{props.children}</div>
}

export component App() {
	const props = { children: 'hello' };

	<Card {...props} />
}
`;

		const result = compile(source, 'test.tsrx', { mode: 'client' }).js.code;

		expect(result).toContain('_$_.spread_props(');
	});

	it('parses less-than comparisons at line start in element children without whitespace', () => {
		const source = `component TodoList({ items }: { items: { text: string }[] }) {
	<ul>var a = 3
	<4;</ul>
}`;

		const ast = parse(source);
		const comp = ast.body[0] as unknown as AST.Component;
		const ul = comp.body.find((n) => n.type === 'Element') as AST.Element;
		expect((ul.id as AST.Identifier).name).toBe('ul');
		expect(ul.children.length).toBeGreaterThanOrEqual(1);
		const decl = ul.children[0] as unknown as AST.VariableDeclaration;
		expect(decl.type).toBe('VariableDeclaration');
	});
});
