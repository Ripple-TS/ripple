import { RippleArray, effect, track, untrack } from 'ripple';
import { compile } from '@tsrx/ripple';

const EFFECT_BODY_REGEX = /_\$\_\.effect\(\(\) => \{([\s\S]*?)\n\t\t\}\);/;

describe('compiler > assignments', () => {
	it('properly handles JS assignments, reads and updates to array indices', () => {
		const logs: (number | undefined)[] = [];

		function App() {
			return <>
				let items: number[] = [];
				let tracked_items = track<number[]>([]);
				let items2 = new Array();
				let items3: RippleArray<number> = new RippleArray();
				let i = 0;
				logs.push(items[0]);
				logs.push(items[i]);
				logs.push(tracked_items.value[0]);
				logs.push(tracked_items.value[i]);
				logs.push(items2[0]);
				logs.push(items2[i]);
				logs.push(items3[0]);
				logs.push(items3[i]);
				items[0] = 123;
				items[i] = 123;
				tracked_items.value[0] = 123;
				tracked_items.value[i] = 123;
				items2[0] = 123;
				items2[i] = 123;
				items3[0] = 123;
				items3[i] = 123;
				logs.push(items[0]);
				logs.push(items[i]);
				logs.push(tracked_items.value[0]);
				logs.push(tracked_items.value[i]);
				logs.push(items2[0]);
				logs.push(items2[i]);
				logs.push(items3[0]);
				logs.push(items3[i]);
				items[0]++;
				items[i]++;
				tracked_items.value[0]++;
				tracked_items.value[i]++;
				items2[0]++;
				items2[i]++;
				items3[0]++;
				items3[i]++;
				logs.push(items[0]);
				logs.push(items[i]);
				logs.push(tracked_items.value[0]);
				logs.push(tracked_items.value[i]);
				logs.push(items2[0]);
				logs.push(items2[i]);
				logs.push(items3[0]);
				logs.push(items3[i]);
				logs.push(--items[0]);
				logs.push(--items[i]);
				logs.push(--tracked_items.value[0]);
				logs.push(--tracked_items.value[i]);
				logs.push(--items2[0]);
				logs.push(--items2[i]);
				logs.push(--items3[0]);
				logs.push(--items3[i]);
			</>;
		}

		render(App);

		expect(logs).toEqual([
			undefined,
			undefined,
			undefined,
			undefined,
			undefined,
			undefined,
			undefined,
			undefined,
			123,
			123,
			123,
			123,
			123,
			123,
			123,
			123,
			125,
			125,
			125,
			125,
			125,
			125,
			125,
			125,
			124,
			123,
			124,
			123,
			124,
			123,
			124,
			123,
		]);
	});

	it('compiles tracked values in effect with assignment expression', () => {
		const source = `import { track, effect } from 'ripple';
function App() { return <>
	let &[count] = track(0);

	effect(() => {
		state.count = count;
	});
</>; }`;
		const result = compile(source, 'test.tsrx');
		const effect_match = result.code.match(EFFECT_BODY_REGEX);
		expect(effect_match?.[1].trim()).toMatchSnapshot();
	});

	it('compiles tracked values in effect with update expressions', () => {
		const source = `import { track, effect, untrack } from 'ripple';
function App() { return <>
	let &[count] = track(5);

	effect(() => {
		untrack(() => {
			state.preIncrement = ++count;
			state.postIncrement = count++;
			state.preDecrement = --count;
			state.postDecrement = count--;
		});
	});
</>; }`;
		const result = compile(source, 'test.tsrx');
		const effect_match = result.code.match(EFFECT_BODY_REGEX);
		expect(effect_match?.[1].trim()).toMatchSnapshot();
	});

	it('compiles unknown lazy array destructuring through lazy array helpers', () => {
		const source = `import { track } from 'ripple';
function Child({ tr: &[count, tr] }) { return <>
	count++;
	tr[0]++;
	<div>{count}</div>
</>; }
function App() { return <>
	let tracked = track(0);
	<Child tr={tracked} />
</>; }`;
		const { code } = compile(source, 'test.tsrx', { mode: 'client' });

		expect(code).toContain('_$_.lazy_array_get(lazy, 0)');
		expect(code).toContain('_$_.lazy_array_update(lazy, 0)');
		expect(code).toContain('_$_.lazy_array_get(lazy, 1)');
		expect(code).toContain('_$_.lazy_array_update(_$_.lazy_array_get(lazy, 1), 0)');
		expect(code).not.toContain('lazy[0]');
		expect(code).not.toContain('lazy[1][0]');
	});

	it('compiles writes to unknown lazy array index 1 through lazy array helpers', () => {
		const source = `function Child({ pair: &[first, second] }) { return <>
	second = 10;
	<div>{first}</div>
</>; }
function App() { return <>
	<Child pair={[0, 1]} />
</>; }`;
		const { code } = compile(source, 'test.tsrx', { mode: 'client' });

		expect(code).toContain('_$_.lazy_array_set(lazy, 10, 1)');
		expect(code).not.toContain('lazy[1] =');
	});

	it('does not double-wrap member access on lazy array value bindings', () => {
		const source = `function Child({ pair: &[first] }) { return <>
	let value = first[0];
	<div>{value}</div>
</>; }
function App() { return <>
	<Child pair={[{ 0: 'x' }]} />
</>; }`;
		const { code } = compile(source, 'test.tsrx', { mode: 'client' });

		expect(code).toContain('let value = _$_.lazy_array_get(lazy, 0)[0];');
		expect(code).not.toContain('_$_.lazy_array_get(_$_.lazy_array_get(lazy, 0), 0)');
	});

	it('throws on indexed access through known tracked lazy destructures', () => {
		const source = `import { track } from 'ripple';
function App() { return <>
	let &[value, tracked_ref] = track({ 0: 'x' });
	let nested = value[0];
	tracked_ref[0] = { 0: 'y' };
	let next = value[0];
	<div>{nested}{next}</div>
</>; }`;

		expect(() => compile(source, 'test.tsrx', { mode: 'client' })).toThrow(
			/Use \.value or &\[\] lazy destructuring/,
		);
	});

	it('throws on known tracked indexed access', () => {
		const source = `import { track } from 'ripple';
function App() { return <>
	let tracked = track(0);
	tracked[0]++;
	tracked[0] = tracked[0] + 1;
	let value = tracked[0];
	let ref = tracked[1];
	<div>{value}</div>
</>; }`;

		expect(() => compile(source, 'test.tsrx', { mode: 'client' })).toThrow(
			/Use \.value or &\[\] lazy destructuring/,
		);
	});
});
