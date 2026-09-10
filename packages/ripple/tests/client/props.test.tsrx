import { describe, it, expect } from 'vitest';
import { flushSync, track } from 'ripple';

// Component call sites with a reactive prop pass a compiled props instance:
// the props are prototype getters, so these tests cover the paths that no
// longer see own properties (enumeration, spread, JSON) alongside reactivity
// and the memoization of props built only from the parent's own props.

describe('compiled props', () => {
	it('keeps reactive props live through the class getters', () => {
		let bump: () => void = () => {};

		function Child(props: { count: number; label: string }) @{
			<span>{props.label + ':' + props.count}</span>
		}

		function App() @{
			let &[count] = track(1);
			bump = () => {
				count++;
			};
			<Child count={count * 2} label="n" />
		}

		render(App);
		expect(container.querySelector('span')?.textContent).toBe('n:2');

		bump();
		flushSync();
		expect(container.querySelector('span')?.textContent).toBe('n:4');
	});

	it('evaluates a prop derived only from the parent props once', () => {
		function Leaf(props: { depth: number; path: string }) @{
			<span>{props.path + '|' + props.depth}</span>
		}

		function Node(props: { depth: number; path: string }) @{
			@if (props.depth > 0) {
				<div>
					<Node depth={props.depth - 1} path={props.path + 'L'} />
					<Node depth={props.depth - 1} path={props.path + 'R'} />
				</div>
			} @else {
				<Leaf depth={props.depth} path={props.path} />
			}
		}

		function App() @{
			<Node depth={2} path="" />
		}

		render(App);
		const leaves = Array.from(container.querySelectorAll('span')).map((el) => el.textContent);
		expect(leaves).toEqual(['LL|0', 'LR|0', 'RL|0', 'RR|0']);
	});

	it('does not memoize a prop whose source reads tracked state', () => {
		let bump: () => void = () => {};

		function Leaf(props: { value: number }) @{
			<span>{props.value}</span>
		}

		function Middle(props: { value: number }) @{
			<Leaf value={props.value + 1} />
		}

		function App() @{
			let &[count] = track(0);
			bump = () => {
				count++;
			};
			<Middle value={count} />
		}

		render(App);
		expect(container.querySelector('span')?.textContent).toBe('1');

		bump();
		flushSync();
		expect(container.querySelector('span')?.textContent).toBe('2');
	});

	it('enumerates and spreads compiled props in .tsrx code', () => {
		function Child(props: { a: number; b: string; c: boolean }) @{
			const keys = Object.keys(props).join(',');
			const values = Object.values(props).join(',');
			const entries = Object.entries(props).map(([key, value]) => key + '=' + value).join(',');
			const copy = { ...props, extra: 'x' };
			const json = JSON.stringify(props);
			<>
				<p>{keys}</p>
				<p>{values}</p>
				<p>{entries}</p>
				<p>{copy.a + copy.b + copy.extra}</p>
				<p>{json}</p>
				<p>
					{'a' in props ? 'has a' : 'no a'}
				</p>
			</>
		}

		function App() @{
			let &[a] = track(1);
			<Child a={a + 1} b="s" c={true} />
		}

		render(App);
		const paragraphs = Array.from(container.querySelectorAll('p')).map((el) => el.textContent);
		expect(paragraphs).toEqual([
			'a,b,c',
			'2,s,true',
			'a=2,b=s,c=true',
			'2sx',
			'{"a":2,"b":"s","c":true}',
			'has a',
		]);
	});

	it('supports lazy rest destructuring of compiled props', () => {
		let bump: () => void = () => {};

		function Child(props: { first: number; second: number; third: string }) @{
			let &{ first, ...rest } = props;
			<span>{first + '/' + rest.second + '/' + rest.third}</span>
		}

		function App() @{
			let &[n] = track(1);
			bump = () => {
				n++;
			};
			<Child first={n} second={n * 10} third="t" />
		}

		render(App);
		expect(container.querySelector('span')?.textContent).toBe('1/10/t');

		bump();
		flushSync();
		expect(container.querySelector('span')?.textContent).toBe('2/20/t');
	});

	it('passes a lazy pair Tracked alias as a stable prop', () => {
		let bump: () => void = () => {};

		function Child(props: { tracked: { value: number } }) @{
			<span>{props.tracked.value}</span>
		}

		function App() @{
			let &[count, countT] = track(5);
			bump = () => {
				count++;
			};
			<Child tracked={countT} />
		}

		render(App);
		expect(container.querySelector('span')?.textContent).toBe('5');

		bump();
		flushSync();
		expect(container.querySelector('span')?.textContent).toBe('6');
	});

	it('switches between the branches of a flattened @if chain', () => {
		let set: (value: number) => void = () => {};

		function App() @{
			let &[value] = track(0);
			set = (next) => {
				value = next;
			};
			@if (value > 1) {
				@if (value > 2) {
					<span>big</span>
				} @else {
					<span>two</span>
				}
			} @else if (value === 1) {
				<span>one</span>
			} @else {
				<span>zero</span>
			}
		}

		render(App);
		const text = () => container.querySelector('span')?.textContent;
		expect(text()).toBe('zero');

		set(1);
		flushSync();
		expect(text()).toBe('one');

		set(2);
		flushSync();
		expect(text()).toBe('two');

		set(3);
		flushSync();
		expect(text()).toBe('big');

		set(0);
		flushSync();
		expect(text()).toBe('zero');
		expect(container.querySelectorAll('span').length).toBe(1);
	});
});
