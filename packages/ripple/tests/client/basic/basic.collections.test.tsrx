import { RippleArray, flushSync, track } from 'ripple';
import { TRACKED_ARRAY } from '../../../src/runtime/internal/client/constants.js';

describe('basic client > collections', () => {
	function countCommentNodes(node: Node) {
		const walker = document.createTreeWalker(node, NodeFilter.SHOW_COMMENT);
		let count = 0;

		while (walker.nextNode()) {
			count++;
		}

		return count;
	}

	it('renders with simple reactive objects', () => {
		function Basic() @{
			let &[user] = track({
				name: 'John',
				age: 25,
			});
			<>
				<div class="name">{user.name}</div>
				<div class="age">{user.age}</div>
				<button
					onClick={() => {
						user = { ...user, name: 'Jane', age: 30 };
					}}
				>{'Update User'}</button>
			</>
		}

		render(Basic);

		const nameDiv = container.querySelector('.name');
		const ageDiv = container.querySelector('.age');
		const button = container.querySelector('button');

		expect(nameDiv.textContent).toBe('John');
		expect(ageDiv.textContent).toBe('25');

		button.click();
		flushSync();

		expect(nameDiv.textContent).toBe('Jane');
		expect(ageDiv.textContent).toBe('30');
	});

	it('renders with nested reactive objects', () => {
		function Basic() @{
			let &[user] = track({
				name: track('John'),
				age: track(25),
			});
			<>
				<div class="name">{user.name.value}</div>
				<div class="age">{user.age.value}</div>
				<button
					onClick={() => {
						user.name.value = 'Jane';
						user.age.value = 30;
					}}
				>{'Update User'}</button>
			</>
		}

		render(Basic);

		const nameDiv = container.querySelector('.name');
		const ageDiv = container.querySelector('.age');
		const button = container.querySelector('button');

		expect(nameDiv.textContent).toBe('John');
		expect(ageDiv.textContent).toBe('25');

		button.click();
		flushSync();

		expect(nameDiv.textContent).toBe('Jane');
		expect(ageDiv.textContent).toBe('30');
	});

	it('works as a reactive RippleArray when constructed using # syntactic sugar', () => {
		function App() @{
			const array = new RippleArray(1, 2, 3);
			<>
				<pre>{String(array[3])}</pre>
				<pre>{array[0]}</pre>
				<pre>{TRACKED_ARRAY in array}</pre>
				<button
					onClick={() => {
						array.push(array.length + 1);
						array[0] = array[0] + 1;
					}}
				>{'Add'}</button>
			</>
		}

		render(App);

		const pre1 = container.querySelectorAll('pre')[0];
		const pre2 = container.querySelectorAll('pre')[1];
		const pre3 = container.querySelectorAll('pre')[2];
		const button = container.querySelector('button');

		expect(pre1.textContent).toBe('undefined');
		expect(pre2.textContent).toBe('1');
		expect(pre3.textContent).toBe('true');

		button.click();
		flushSync();

		expect(pre1.textContent).toBe('4');
		expect(pre2.textContent).toBe('2');
	});

	it('cleans up mixed tsrx collection sentinels and trailing text on rerender', () => {
		function App() @{
			let &[primary] = track(true);
			<>
				<div class="frame">
					{<>
						{primary
							? [
									'first:',
									<strong class="middle">{'one'}</strong>,
									':tail',
								]
							: [
									'second:',
									<strong class="middle">{'two'}</strong>,
									':done',
								]}
					</>}
				</div>
				<button
					onClick={() => {
						primary = !primary;
					}}
				>{'toggle'}</button>
			</>
		}

		render(App);

		const frame = container.querySelector('.frame');
		const button = container.querySelector('button');
		const initialCommentCount = countCommentNodes(frame);

		expect(frame.textContent).toBe('first:one:tail');
		expect(frame.querySelectorAll('.middle')).toHaveLength(1);

		button.click();
		flushSync();

		expect(frame.textContent).toBe('second:two:done');
		expect(frame.querySelectorAll('.middle')).toHaveLength(1);
		expect(countCommentNodes(frame)).toBe(initialCommentCount);

		button.click();
		flushSync();

		expect(frame.textContent).toBe('first:one:tail');
		expect(frame.querySelectorAll('.middle')).toHaveLength(1);
		expect(countCommentNodes(frame)).toBe(initialCommentCount);
	});

	it('flattens nested primitive arrays inside mixed tsrx collections', () => {
		function App() @{
			<div class="frame">
				{<>
					{[
						'start:',
						['one', 2, true, null, false],
						<strong>{'!'}</strong>,
						':end',
					]}
				</>}
			</div>
		}

		render(App);

		expect(container.querySelector('.frame').textContent).toBe('start:one2truefalse!:end');
	});

	it('flattens direct primitive array expressions', () => {
		function App() @{
			const items = ['start:', ['one', 2], null, true, false, ':end'];
			<>
				<div class="frame">
					{['start:', ['one', 2], null, true, false, ':end']}
				</div>
				<div class="bound-frame">{items}</div>
			</>
		}

		render(App);

		expect(container.querySelector('.frame').textContent).toBe('start:one2truefalse:end');
		expect(container.querySelector('.bound-frame').textContent).toBe('start:one2truefalse:end');
	});

	it('flattens conditional primitive array expressions', () => {
		function App() @{
			const condition = true;
			const ternary_items = condition
				? ['start:', ['one', 2], null, true, false, ':end']
				: ['fallback'];
			const logical_items = condition && ['start:', ['one', 2], null, true, false, ':end'];
			<>
				<div class="ternary-frame">{ternary_items}</div>
				<div class="logical-frame">{logical_items}</div>
			</>
		}

		render(App);

		expect(container.querySelector('.ternary-frame').textContent).toBe('start:one2truefalse:end');
		expect(container.querySelector('.logical-frame').textContent).toBe('start:one2truefalse:end');
	});
});
