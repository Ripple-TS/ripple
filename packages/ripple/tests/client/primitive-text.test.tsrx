import { flushSync, track } from 'ripple';

it('renders shadowed intrinsic calls as elements beside text', () => {
	function App() @{
		const String = () => <b>string</b>;
		const Number = () => <b>number</b>;
		const Boolean = () => <b>boolean</b>;
		const BigInt = () => <b>bigint</b>;
		const Date = () => <b>date</b>;
		<>
			<p>before{String()}after</p>
			<p>before{Number()}after</p>
			<p>before{Boolean()}after</p>
			<p>before{BigInt()}after</p>
			<p>before{Date()}after</p>
		</>
	}
	render(App);
	expect([...container.querySelectorAll('b')].map((node) => node.textContent)).toEqual([
		'string',
		'number',
		'boolean',
		'bigint',
		'date',
	]);
});

it('keeps numeric addition, bigint conversion, and sequence effects during updates', () => {
	let calls = 0;
	function App() @{
		let &[count] = track(2);
		<>
			<p>sum: {Number(count) + Number(count)}</p>
			<div>
				{'big: '}
				{(calls++, BigInt(count) satisfies bigint)}
			</div>
			<button onClick={() => count++}>update</button>
		</>
	}
	render(App);
	expect(container.querySelector('p').textContent).toBe('sum: 4');
	expect(container.querySelector('div').textContent).toBe('big: 2');
	expect(calls).toBe(1);
	container.querySelector('button').click();
	flushSync();
	expect(container.querySelector('p').textContent).toBe('sum: 6');
	expect(container.querySelector('div').textContent).toBe('big: 3');
	expect(calls).toBe(2);
});
