import { track } from 'ripple';

// Reactive components for hydration testing

export function TrackedState() {
	return <>
		let &[count] = track(0);
		<div class="count">{count}</div>
	</>;
}

export function CounterWithInitial(props: { initial: number }) {
	return <>
		let &[count] = track(props.initial);
		<div>
			<span class="count">{count}</span>
		</div>
	</>;
}

export function CounterWrapper() {
	return <><CounterWithInitial initial={5} /></>;
}

export function ComputedValues() {
	return <>
		let &[a] = track(2);
		let &[b] = track(3);
		const sum = () => a + b;
		<div class="sum">{sum()}</div>
	</>;
}

export function MultipleTracked() {
	return <>
		let &[x] = track(10);
		let &[y] = track(20);
		let &[z] = track(30);
		<div class="x">{x}</div>
		<div class="y">{y}</div>
		<div class="z">{z}</div>
	</>;
}

export function DerivedState() {
	return <>
		let &[firstName] = track('John');
		let &[lastName] = track('Doe');
		const fullName = () => `${firstName} ${lastName}`;
		<div class="name">{fullName()}</div>
	</>;
}
