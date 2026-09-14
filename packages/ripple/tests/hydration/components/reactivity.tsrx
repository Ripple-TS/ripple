import { track } from 'ripple';

// Reactive components for hydration testing

export function TrackedState() @{
	const count = track(0);
	<div class="count">{count.value}</div>
}

export function CounterWithInitial(props: { initial: number }) @{
	const count = track(props.initial);
	<div>
		<span class="count">{count.value}</span>
	</div>
}

export function CounterWrapper() @{
	<CounterWithInitial initial={5} />
}

export function ComputedValues() @{
	const a = track(2);
	const b = track(3);
	const sum = () => a.value + b.value;
	<div class="sum">{sum()}</div>
}

export function MultipleTracked() @{
	const x = track(10);
	const y = track(20);
	const z = track(30);
	<div class="multiple-tracked">
		<div class="x">{x.value}</div>
		<div class="y">{y.value}</div>
		<div class="z">{z.value}</div>
	</div>
}

export function DerivedState() @{
	const firstName = track('John');
	const lastName = track('Doe');
	const fullName = () => `${firstName.value} ${lastName.value}`;
	<div class="name">{fullName()}</div>
}
