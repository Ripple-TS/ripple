import { RippleObject, effect, flushSync, snapshot } from 'ripple';
import { TRACKED_OBJECT } from '../../src/runtime/internal/client/constants.js';

describe('RippleObject', () => {
	it('makes new properties reactive', () => {
		function ObjectTest() @{
			const obj = new RippleObject({ a: -1 });
			obj.a = 0;
			<>
				<pre>{obj.a}</pre>
				<button
					onClick={() => {
						obj.a++;
					}}
				>{'Increment A'}</button>
			</>
		}

		render(ObjectTest);

		const pre1 = container.querySelectorAll('pre')[0];
		const button = container.querySelectorAll('button')[0];

		expect(pre1.textContent).toBe('0');

		button.click();
		flushSync();

		expect(pre1.textContent).toBe('1');
	});

	it('makes existing object properties reactive', () => {
		function ObjectTest() @{
			const obj = new RippleObject({ a: 0 });
			<>
				<pre>{obj.a}</pre>
				<button
					onClick={() => {
						obj.a++;
					}}
				>{'Increment A'}</button>
			</>
		}

		render(ObjectTest);

		const pre1 = container.querySelectorAll('pre')[0];
		const button = container.querySelectorAll('button')[0];

		expect(pre1.textContent).toBe('0');

		button.click();
		flushSync();

		expect(pre1.textContent).toBe('1');
	});

	it('checks if property exists via the has trap', () => {
		function ObjectTest() @{
			const obj = new RippleObject({ a: -1, b: 1 });
			obj.a = 0;
			<pre>{'a' in obj && 'b' in obj}</pre>
		}

		render(ObjectTest);

		const pre1 = container.querySelectorAll('pre')[0];

		expect(pre1.textContent).toBe('true');
	});

	it('deletes properties via the delete trap', () => {
		function ObjectTest() @{
			const obj = new RippleObject<{ a?: number; b: number }>({ a: 0, b: 1 });
			<>
				<pre>{String(obj.a)}</pre>
				<button
					onClick={() => {
						delete obj.a;
					}}
				>{'Delete A'}</button>
			</>
		}

		render(ObjectTest);

		const pre1 = container.querySelectorAll('pre')[0];
		const button = container.querySelectorAll('button')[0];

		expect(pre1.textContent).toBe('0');

		button.click();
		flushSync();

		expect(pre1.textContent).toBe('undefined');
	});

	it('checks if non-existent property is reactive when added later', () => {
		function ObjectTest() @{
			const obj = new RippleObject<{ a?: number }>({});
			<>
				<pre>{String(obj.a)}</pre>
				<button
					onClick={() => {
						obj.a = 1;
					}}
				>{'Add A'}</button>
			</>
		}

		render(ObjectTest);

		const pre1 = container.querySelectorAll('pre')[0];
		const button = container.querySelectorAll('button')[0];

		expect(pre1.textContent).toBe('undefined');

		button.click();
		flushSync();

		expect(pre1.textContent).toBe('1');
	});

	it('checks that deeply nested objects are not proxied or reactive', () => {
		function ObjectTest() @{
			const obj = new RippleObject({ a: { b: 1 } });
			<>
				<pre>{String(obj.a.b)}</pre>
				<button
					onClick={() => {
						obj.a.b++;
					}}
				>{'Increment B'}</button>
			</>
		}

		render(ObjectTest);

		const pre1 = container.querySelectorAll('pre')[0];
		const button = container.querySelectorAll('button')[0];

		expect(pre1.textContent).toBe('1');

		button.click();
		flushSync();

		// remains unchanged
		expect(pre1.textContent).toBe('1');
	});

	it('checks if TRACKED_OBJECT symbol is present on RippleObject instances', () => {
		function ObjectTest() @{
			const obj = new RippleObject({ a: 0 });
			expect(TRACKED_OBJECT in obj).toBe(true);
			<pre>{'done'}</pre>
		}

		render(ObjectTest);
	});

	it('uses the hash syntax for creating RippleObject', () => {
		function ObjectTest() @{
			const obj = new RippleObject({ a: 0, b: 1, c: { d: { e: 8 } } });
			<>
				<pre>{obj.a}</pre>
				<pre>{TRACKED_OBJECT in obj}</pre>
				<pre>{JSON.stringify(obj)}</pre>
				<button
					onClick={() => {
						obj.a++;
					}}
				>{'Increment A'}</button>
			</>
		}

		render(ObjectTest);

		const pre1 = container.querySelectorAll('pre')[0];
		const pre2 = container.querySelectorAll('pre')[1];
		const pre3 = container.querySelectorAll('pre')[2];
		const button = container.querySelectorAll('button')[0];

		expect(pre1.textContent).toBe('0');
		expect(pre2.textContent).toBe('true');
		expect(pre3.textContent).toBe('{"a":0,"b":1,"c":{"d":{"e":8}}}');

		button.click();
		flushSync();

		expect(pre1.textContent).toBe('1');
		expect(pre3.textContent).toBe('{"a":1,"b":1,"c":{"d":{"e":8}}}');
	});

	it('snapshot() returns a detached plain copy of current values', () => {
		let snap: any;

		function ObjectTest() @{
			const obj = new RippleObject({ a: 1, b: 2 });
			obj.a = 10;
			snap = snapshot(obj);
			// a later mutation must not affect the snapshot
			obj.a = 99;
			<div />
		}

		render(ObjectTest);

		expect(snap).toEqual({ a: 10, b: 2 });
		// detached: a plain object, not a proxy
		expect(TRACKED_OBJECT in snap).toBe(false);
		expect(snap.a).toBe(10);
	});

	it('snapshot() reads without registering reactivity', () => {
		let runs = 0;

		function ObjectTest() @{
			const obj = new RippleObject({ a: 0 });
			effect(() => {
				snapshot(obj);
				runs++;
			});
			<button
				onClick={() => {
					obj.a++;
				}}
			>{'Increment A'}</button>
		}

		render(ObjectTest);
		flushSync();
		expect(runs).toBe(1);

		container.querySelectorAll('button')[0].click();
		flushSync();
		// snapshot did not subscribe, so the effect must not re-run
		expect(runs).toBe(1);
	});
});
