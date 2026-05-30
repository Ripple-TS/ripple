import { parse, compile, compile_to_volar_mappings } from '@tsrx/ripple';
import type * as AST from 'estree';
import type * as ESTreeJSX from 'estree-jsx';

function get_returned_tsrx(node: any): any {
	const target =
		node.type === 'ExportNamedDeclaration' ? node.declaration : node;
	const body =
		target.type === 'VariableDeclarator' ? target.init.body : target.body;

	if (body.type !== 'BlockStatement') {
		return body;
	}

	return body.body.find((child: AST.Node) => child.type === 'ReturnStatement')?.argument;
}

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
		const source = `export function App() { return <>
  <div id="myid" class="myclass">{"Hello World"}</div>

  <style>__STYLE__</style>
</>; }`;
		const style1 = '.myid {color: green }';
		const style2 = '#myid {color: green }';
		const style3 = 'div {color: green }';

		let input = source.replace('__STYLE__', style1);
		let ast = parse(input);
		expect(get_returned_tsrx(ast.body[0]).children.at(-1).children[0].source).toEqual(style1);

		input = source.replace('__STYLE__', style2);
		ast = parse(input);
		expect(get_returned_tsrx(ast.body[0]).children.at(-1).children[0].source).toEqual(style2);

		input = source.replace('__STYLE__', style3);
		ast = parse(input);
		expect(get_returned_tsrx(ast.body[0]).children.at(-1).children[0].source).toEqual(style3);
	});

	it('parses text as an ordinary expression identifier', () => {
		const source = `export function App() { return <>
	const markup = '<span>Not HTML</span>';
	const text = markup;

	<div>{markup}</div>
	<div>{text}</div>
</>; }`;

		const ast = parse(source);
		const elements = get_returned_tsrx(ast.body[0]).children.filter(
			(node: AST.Node) => node.type === 'Element',
		) as AST.Element[];
		const expression = elements[0].children[0] as AST.Node & { expression: AST.Expression };
		const text_expression = elements[1].children[0] as AST.Node & { expression: AST.Expression };

		expect(elements).toHaveLength(2);
		expect(expression.type).toBe('TSRXExpression');
		expect((expression.expression as AST.Identifier).name).toBe('markup');
		expect(text_expression.type).toBe('TSRXExpression');
		expect((text_expression.expression as AST.Identifier).name).toBe('text');

		const { code } = compile(source, 'text-directive.tsrx', { mode: 'client' });
		expect(code).not.toContain('_$_.html');

		const invalid_source = `export function App() { return <>
	const markup = 'plain';

	<div>{text markup}</div>
</>; }`;

		expect(() => parse(invalid_source)).toThrow();
	});

	it('optimizes string-shaped expressions as text nodes', () => {
		const source = `export function App(
	{ title, props }: { title: string; props: { label: string } },
) { return <>
	const element = <span />;

	<div>{String(title)}</div>
	<div>{title + ''}</div>
	<div>{title as string}</div>
	<div>{title}</div>
	<div>{props.label}</div>
	<div>{element}</div>
</>; }`;

		const { code } = compile(source, 'stringish-text.tsrx', { mode: 'client' });

		expect(code).toContain('_$_.set_text');
		expect(code).toContain('nodeValue = title');
		expect(count_occurrences(code, '_$_.expression')).toBe(1);
	});

	it('parses backtick expressions inside TSRX fragments as template literals', () => {
		const source = `let a = function() {
			return <>
				<>
					\`333\`
				</>
			</>;
		}`;

		const ast = parse(source);
		const declaration = (ast.body[0] as AST.VariableDeclaration).declarations[0];
		const fragment = get_returned_tsrx(declaration).children[0] as any;

		expect(fragment.type).toBe('TsrxFragment');
		expect(fragment.children[0].type).toBe('ExpressionStatement');
		expect(fragment.children[0].expression.type).toBe('TemplateLiteral');
		expect(fragment.children[0].expression.quasis[0].value.raw).toBe('333');
	});

	it('parses backtick expressions around tag-like text inside TSRX fragments', () => {
		const source = `let a = function() {
			return <>
				<>
					\`
					<b></b>
					\`
				</>
			</>;
		}`;

		const ast = parse(source);
		const declaration = (ast.body[0] as AST.VariableDeclaration).declarations[0];
		const fragment = get_returned_tsrx(declaration).children[0] as any;

		expect(fragment.type).toBe('TsrxFragment');
		expect(fragment.children.map((child: any) => child.type)).toEqual([
			'ExpressionStatement',
		]);
		expect(fragment.children[0].expression.type).toBe('TemplateLiteral');
		expect(fragment.children[0].expression.quasis[0].value.raw).toContain('<b></b>');
	});

	it('renders without crashing', () => {
		function App() {
			return <>
				let foo: Record<string, number>;
				let bar: Record<string, number>;
				let baz: Record<string, number>;
				foo = {};
				foo = { test: 0 };
				foo['abc'] = 123;
				bar = { def: 456 };
				baz = { ghi: 789 };
				baz['jkl'] = 987;
			</>;
		}

		render(App);
	});

	it('renders without crashing using < character', () => {
		function App() {
			return <>
				function bar() {
					for (let i = 0; i < 10; i++) {
						// do nothing
					}
					const x = 1 < 1;
				}
				let x = 5 < 10;
				<div>{x}</div>
			</>;
		}

		render(App);
	});

	it('renders lexical blocks without crashing', () => {
		function App() {
			return <>
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
			</>;
		}

		render(App);
	});

	it('renders without crashing using mapped types', () => {
		function App() {
			return <>
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
			</>;
		}

		render(App);
	});

	it('renders without crashing using object destructuring', () => {
		function App() {
			return <>
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
			</>;
		}

		render(App);
	});

	it('renders without crashing using object destructuring #2', () => {
		function App() {
			return <>
				const obj = { a: 1, b: 2, c: 3 };
				const { a, b, ...rest } = obj;
				{'a '}
				{a}
				{'b '}
				{b}
				{'rest '}
				{JSON.stringify(rest)}
				<div />
			</>;
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

		function App() {
			return <>
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
			</>;
		}

		render(App);
	});

	it('compiles without needing semicolons between statements and JSX', () => {
		const source = `export function App() { return <>
	<div>const code4 = 4

	const code3 = 3
		<div>
			<div>
				const code = 1
			</div>
			const code2 = 2
		</div>
	</div>
</>; }`;

		const result = compile(source, 'test.tsrx', { mode: 'client' });
	});

	it('calculates fragment hop count for sibling fragments', () => {
		const source = `export function App() { return <>
	<div class="a">{'a'}</div>
	<div class="b">{'b'}</div>
</>; }`;

		const { code } = compile(source, 'grouped-count.tsrx', { mode: 'client' });

		expect(code).toMatch(/_\$_\.template\([\s\S]*,\s*1,\s*2\)/);
		expect(code).not.toMatch(/_\$_\.template\([\s\S]*,\s*1,\s*3\)/);
	});

	it('emits anonymous component expressions as arrows in client output', () => {
		const source = `
const Inline = (props) => <>
	<div>{props.x}</div>
</>
`;
		const result = compile(source, 'anonymous-component.tsrx', { mode: 'client' }).code;

		expect(result).toContain('const Inline = (props) => {');
		expect(result).toContain('(props) => {');
		expect(result).toContain('return _$_.tsrx_element((__anchor, __block) =>');
		expect(result).not.toContain('function Inline');
		expect(result).not.toContain('function (__anchor');
	});

	it('emits function-expression components as functions in client output', () => {
		const source = `
const Inline = function(props) { return <>
	<div>{props.x}</div>
</>; }
`;
		const result = compile(source, 'anonymous-component.tsrx', { mode: 'client' }).code;

		expect(result).toContain('const Inline = function (props) {');
		expect(result).toContain('function (props) {');
		expect(result).toContain('return _$_.tsrx_element((__anchor, __block) =>');
		expect(result).not.toContain('function Inline');
		expect(result).not.toContain('const Inline = (__anchor, props, __block) => {');
	});

	it('emits function calls with nested template returns as expressions in client output', () => {
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
		const result = compile(source, 'nested-template-return.tsrx', { mode: 'client' }).code;

		expect(result).toContain('_$_.expression(expression, () => make(true))');
	});

	// 	it(
	// 		'imports and uses only obfuscated Tracked imports when encountering only shorthand syntax',
	// 		() => {
	// 			const source = `
	// import { RippleArray, RippleObject, RippleSet, RippleMap, createRefKey } from 'ripple';
	// function App() { return <>
	// 	const items = new RippleArray(1, 2, 3);
	// 	const obj = new RippleObject({ a: 1, b: 2, c: 3 });
	// 	const set = RippleSet([1, 2, 3]);
	// 	const map = RippleMap([['a', 1], ['b', 2], ['c', 3]]);

	// 	<div ref={() => {}} />
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
	// function App() { return <>
	// 	const items = new RippleArray(1, 2, 3);
	// 	const obj = new RippleObject({ a: 1, b: 2, c: 3 });
	// 	const set = RippleSet([1, 2, 3]);
	// 	const map = RippleMap([['a', 1], ['b', 2], ['c', 3]]);

	// 	<div ref={() => {}} />
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
	// function App() { return <>
	// 	const items = new RippleArray(1, 2, 3);
	// 	const obj = new RippleObject({ a: 1, b: 2, c: 3 });
	// 	const set = RippleSet([1, 2, 3]);
	// 	const map = RippleMap([['a', 1], ['b', 2], ['c', 3]]);

	// 	<div ref={() => {}} />
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
function App() { return <>
    let value = track('test');
    function inputRef(node) {}

    const props = {
            id: 'example',
            value: value.value,
            [createRefKey()]: inputRef,
    };
</>; }
`;

		const result = compile_to_volar_mappings(source, 'test.tsrx').code;

		expect(result).toMatch(/value:\s*value\.value/);
	});

	it('keeps lazy destructuring as plain destructuring in to_ts output', () => {
		const track_source = `
import { track } from 'ripple';
function App() { return <>
	let &[value, ...rest] = track(0);
	const x = value;
</>; }
`;
		const track_result = compile_to_volar_mappings(track_source, 'test.tsrx').code;
		expect(track_result).toContain('let [value, ...rest] = track(0);');
		expect(track_result).toContain('const x = value;');
		expect(track_result).not.toContain('let lazy = track(0)');
		expect(track_result).not.toContain('.slice(');
		expect(track_result).not.toContain('_$_.get(');
		expect(track_result).not.toContain('lazy0');
	});

	it('lowers native expression values in to_ts output', () => {
		const source = `
function App() { return <>
	const nested = <>
		<span class="nested-tsx">
			{'inside nested tsx'}
		</span>
	</>;
	const content = <div class="native">{nested}</div>;

	{content}
</>; }
`;
		const result = compile_to_volar_mappings(source, 'test.tsrx').code;

		expect(result).toContain('const nested = <span class="nested-tsx">');
		expect(result).toContain('return <>{children}</>;');
		expect(result).toContain('const content = <div class="native">');
	});

	it('keeps assigned style blocks anchored in to_ts output', () => {
		const source = `
function App() { return <>
	const styles = <style>
		.logo { display: block; }
	</style>;

	<div class={styles.logo} />
</>; }
`;
		const result = compile_to_volar_mappings(source, 'test.tsrx', { loose: true });
		const source_offset = source.indexOf('<style>') + 1;
		const mapping = result.mappings.find((mapping: {
			sourceOffsets: number[];
			lengths: number[];
		}) => {
			const start = mapping.sourceOffsets[0];
			const end = start + mapping.lengths[0];
			return source_offset >= start && source_offset < end;
		});

		expect(result.code).toContain('<style></style>');
		expect(result.code).toContain('const styles = {');
		expect(result.code).not.toContain('(<style></style>,');
		expect(result.code).toContain('\'logo\'');
		expect(mapping).toBeDefined();
		expect(mapping?.data.completion).toBe(true);
		expect(mapping?.data.verification).toBe(false);
	});

	it('maps identifiers from native expression values in to_ts output', () => {
		const source = `
function App() { return <>
	const nested = <>
		<span class="nested-tsx">
			{'inside nested tsx'}
		</span>
	</>;
	const content = <div class="native">{nested}</div>;

	{content}
</>; }
`;
		const result = compile_to_volar_mappings(source, 'test.tsrx', { loose: true });
		const source_declaration = source.indexOf('nested =');
		const source_reference = source.indexOf('nested}</div>');
		const generated_declaration = result.code.indexOf('const nested') + 'const '.length;
		const generated_reference = result.code.indexOf('nested;', generated_declaration);

		function find_mapping(source_offset: number, generated_offset: number) {
			return result.mappings.find(
				(mapping) =>
					mapping.sourceOffsets[0] === source_offset &&
						mapping.generatedOffsets[0] === generated_offset &&
						mapping.lengths[0] === 'nested'.length &&
						mapping.generatedLengths[0] === 'nested'.length,
			);
		}

		expect(find_mapping(source_declaration, generated_declaration)).toBeDefined();
		expect(find_mapping(source_reference, generated_reference)).toBeDefined();
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

export function MyComponent<Item>(props: Props<Item>) { return <>
	<div />
</>; }
`;
		const result = compile_to_volar_mappings(source, 'test.tsrx').code;

		expect(result).toContain('export function MyComponent<Item>(props: Props<Item>)');
	});

	it('preserves arrow functions that return TSRX in to_ts output', () => {
		const source = `
const Inline = (props: { x: string }) => <>
	<div>{props.x}</div>
</>
`;
		const result = compile_to_volar_mappings(source, 'test.tsrx').code;

		expect(result).toContain('const Inline = (props: { x: string }) => <div>');
		expect(result).not.toContain('function Inline');
		expect(result).not.toContain('function (props');
	});

	it('preserves function expressions that return TSRX in to_ts output', () => {
		const source = `
const Inline = function(props: { x: string }) { return <>
	<div>{props.x}</div>
</>; }
`;
		const result = compile_to_volar_mappings(source, 'test.tsrx').code;

		expect(result).toContain('const Inline = function(props: { x: string }) {');
		expect(result).not.toContain('function Inline');
		expect(result).not.toContain('const Inline = (props: { x: string }) => {');
	});

	it('preserves generic type arguments on JSX component tags in to_ts output', () => {
		const source = `
type User = { name: string };

function RenderProp<Item>(props: { children: (item: Item) => any }) { return <></>; }

export function App() { return <>
	<RenderProp<User>>
		{(item) => item.name}
	</RenderProp>
</>; }
`;
		const result = compile_to_volar_mappings(source, 'test.tsrx').code;

		expect(result).toContain('<RenderProp<User>');
	});

	it('preserves generic type arguments on self-closing JSX component tags in to_ts output', () => {
		const source = `
function Box<T>({ value }: { value: T }) { return <>
	<div>{String(value)}</div>
</>; }

export function App() { return <>
	<Box<string> value="hi" />
</>; }
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
				}) =>
					mapping.sourceOffsets[0] === source_offset &&
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
		const { code } = compile(source, 'tracked-nested-lazy.tsrx', { mode: 'client' });

		// Nested lazy array should still use tracked tuple fast path from outer annotation.
		expect(code).toContain('_$_.update(');
		expect(code).not.toContain('[0]');
		expect(code).not.toContain('[1]');
	});

	it('uses tracked fast path for nested lazy params at tuple rest positions', () => {
		const source = `
import type { Tracked } from 'ripple';
function use_tuple_rest({ value: [head, &[count, tracked]] }: { value: [number, ...Tracked<number>[]] }) {
	count++;
	return tracked;
}
`;
		const { code } = compile(source, 'tracked-nested-lazy-tuple-rest.tsrx', { mode: 'client' });

		// Tuple rest element access should resolve to Tracked<number>, not Tracked<number>[].
		expect(code).toContain('_$_.update(');
		expect(code).not.toContain('[1]');
	});

	it('preserves generic type args in interface extends for Volar mappings', () => {
		const source = `
interface PolymorphicProps<T extends keyof HTMLElementTagNameMap> {
	as?: T;
}

interface Props extends PolymorphicProps<'div'> {
	id: string;
}

export function App(props: Props) { return <>
	<div id={props.id} />
</>; }
`;

		const result = compile_to_volar_mappings(source, 'test.tsrx').code;

		expect(result).toContain('extends PolymorphicProps<\'div\'>');
	});

	it('handles if-else expression statements in Volar mappings', () => {
		const source = `
import { track } from 'ripple';
export function App() { return <>
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
</>; }
`;

		expect(() => compile_to_volar_mappings(source, 'test.tsrx')).not.toThrow();
	});

	it('should not error on having js below markup in the same scope', () => {
		const code = `
function Card(props) { return <>
	<div class="card">
		{props.children}
	</div>
</>; }

export function App() { return <>
		function children() { return <>
			<p>{'Card content here'}</p>
		</>; }

		<Card {children} />

	const test = 5;

	<div>{test}</div>
</>; }
`;
		expect(() => compile(code, 'test.tsrx')).not.toThrow();
	});

	it('allows component functions inside composite children', () => {
		const source = `
export function App() { return <>
	<ark.div class="host-class" data-value="42">
		function asChild({ children, href, ...rest }: { href: string; [key: string]: any }) { return <>
			<a id="aschild-anchor" {href} {...rest} data-extra="yes">{'Link'}</a>
		</>; }
	</ark.div>
</>; }
`;

		expect(() => compile_to_volar_mappings(source, 'test.tsrx')).not.toThrow();
	});

	it('allows parent element attributes referencing child-declared functions', () => {
		const source = `
export function App() { return <>
	<Test {Z}>
		function Z() { return <>
			<div>{'hello'}</div>
		</>; }
	</Test>
</>; }
`;

		expect(() => compile(source, 'test.tsrx')).not.toThrow();
	});

	it('preserves explicit component props in Volar mappings', () => {
		const source = `
export function App() { return <>
	function asChild({ children, href, ...rest }: { href: string; [key: string]: any }) { return <>
		<a id="aschild-anchor" {href} {...rest} data-extra="yes">{'Link'}</a>
	</>; }

	<ark.div class="host-class" data-value="42" {asChild} />
</>; }
`;
		const result = compile_to_volar_mappings(source, 'test.tsrx').code;

		expect(result).toContain('<ark.div class="host-class" data-value="42" asChild={asChild}');
		expect(result).not.toContain('children={() =>');
	});

	it('merges explicit children prop with implicit children in client output', () => {
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

		const result = compile(source, 'test.tsrx', { mode: 'client' }).code;

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

export function App() { return <>
	const test = new Test();
	<div>{test.count}</div>
</>; }
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

export function App() { return <>
	const store = new Store();
	<div>{store.count}</div>
</>; }
`;
		const result = compile(source, 'test.tsrx', { mode: 'client' });
		const code = result.code;

		// The constructor's compiled output should contain __block = _$_.scope()
		expect(code).toContain('__block');
		expect(code).toContain('_$_.scope()');
	});

	it('parses effect and untrack calls', () => {
		const source = `
import { track, effect, untrack } from 'ripple';

function App() { return <>
	let &[count] = track(0);

	effect(() => {
		const snapshot = untrack(() => count);
		console.log(snapshot);
	});
</>; }
`;

		const ast = parse(source);
		const ast_json = JSON.stringify(ast);

		expect(ast_json).toContain('"name":"effect"');
		expect(ast_json).toContain('"name":"untrack"');
	});

	it('collects duplicate declaration parser errors in loose mode', () => {
		const source = `
import { track } from 'ripple';
export function App() { return <>
	let test = track(false);
	let test = 'hey';
</>; }
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

function App() { return <>
	const user = getUser();
	const user2 = loadUser();
	<div>{user.id}{user2.id}</div>
</>; }`;
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
				(mapping) =>
					mapping.sourceOffsets[0] === source_offset &&
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

	it('reports return statements inside returned TSRX fragments in Volar mappings', () => {
		const result = compile_to_volar_mappings(
			`function App() { return <>
				return <div />;
			</>; }`,
			'test.tsrx',
		);

		expect(result.errors.map((error) => error.code)).toEqual(['tsrx-template-return-statement']);
	});

	it('throws for unclosed tsx compat tags instead of hanging', () => {
		const source = `export function App() { return <tsx:react>1; }`;

		expect(() => compile(source, 'test.tsrx')).toThrow(
			'Unclosed tag \'<tsx:react>\'. Expected \'</tsx:react>\' before end of template.',
		);
	});

	it('recovers unclosed tsx compat tags in loose mode', () => {
		const source = `export function App() { return <tsx:react>1; }`;

		expect(() => compile_to_volar_mappings(source, 'test.tsrx', { loose: true })).not.toThrow();

		const result = compile_to_volar_mappings(source, 'test.tsrx', { loose: true });
		expect(result.errors).toEqual([]);
	});

	it('throws for unclosed tsx compat tags outside loose mode', () => {
		const source = `export function App() { return <tsx:react>1; }`;

		expect(() => compile(source, 'test.tsrx', { collect: true })).toThrow(
			'Not implemented: TsxCompat',
		);
	});

	it('collects analyzer errors outside loose mode', () => {
		const source = `
import { track } from 'ripple';

const outside = track(0);

export function App() { return <></>; }
`;

		const result = compile(source, 'test.tsrx', { collect: true });
		expect(result.errors.map((error) => error.message)).toContain(
			'`track` can only be used within a reactive context, such as a component, function or class that is used or created from a component',
		);
	});

	it('does not let nested for...of continues satisfy an outer if body', () => {
		const source = `
export function App({ items }: { items: string[] }) { return <>
	if (items.length) {
		for (const item of items) {
			if (!item) continue
		}
	}
</>; }`;

		const result = compile(source, 'test.tsrx', { collect: true });
		expect(result.errors.map((error) => error.message)).toContain(
			'Component if statements must contain a template in their "then" body. Move the if statement into an effect if it does not render anything.',
		);
	});

	it('preserves class extends generic type arguments in volar output', () => {
		const source = `class StringMap extends Map<string, string> {}
export function App() { return <></>; }`;

		expect(() => compile_to_volar_mappings(source, 'test.tsrx', { loose: true })).not.toThrow();

		const result = compile_to_volar_mappings(source, 'test.tsrx', { loose: true }).code;

		expect(result).toContain('class StringMap extends Map<string, string> {}');
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

		const result = compile(source, 'test.tsrx', { mode: 'client' }).code;

		expect(result).toContain('_$_.normalize_children(');
	});

	it(
		'parses a JS statement inside an element with no trailing whitespace before the closing tag',
		() => {
			const source = `function TodoList({ items }: { items: { text: string }[] }) { return <>
  <ul>var a = "123"</ul>
</>; }`;
			const ast = parse(source);
			const ul = get_returned_tsrx(ast.body[0]).children.find(
				(n: AST.Node) => n.type === 'Element',
			) as AST.Element;
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
function Card(props) { return <>
	<div>{props.children}</div>
</>; }

export function App() { return <>
	const props = { children: 'hello' };

	<Card {...props} />
</>; }
`;

		const result = compile(source, 'test.tsrx', { mode: 'client' }).code;

		expect(result).toContain('_$_.spread_props(');
	});

	it('parses less-than comparisons at line start in element children without whitespace', () => {
		const source = `function TodoList({ items }: { items: { text: string }[] }) { return <>
	<ul>var a = 3
	<4;</ul>
</>; }`;

		const ast = parse(source);
		const ul = get_returned_tsrx(ast.body[0]).children.find(
			(n: AST.Node) => n.type === 'Element',
		) as AST.Element;
		expect((ul.id as AST.Identifier).name).toBe('ul');
		expect(ul.children.length).toBeGreaterThanOrEqual(1);
		const decl = ul.children[0] as unknown as AST.VariableDeclaration;
		expect(decl.type).toBe('VariableDeclaration');
	});
});
