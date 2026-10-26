import { bindValue, track } from 'ripple';

export function Input({ initial = '', type = 'text', transform }) @{
	const value = track(initial);
	const binding =
		transform
			? bindValue(() => value.value, (next) => (value.value = transform(next)))
			: bindValue(value);
	<div>
		<input type={type} ref={binding} />
		<output>{JSON.stringify(value.value)}</output>
		<button onClick={() => (value.value = initial)}>reset</button>
	</div>
}

export function Textarea({ initial = '', transform }) @{
	const value = track(initial);
	const binding =
		transform
			? bindValue(() => value.value, (next) => (value.value = transform(next)))
			: bindValue(value);
	<div>
		<textarea ref={binding} />
		<output>{JSON.stringify(value.value)}</output>
		<button onClick={() => (value.value = initial)}>reset</button>
	</div>
}

export function SeededInput() @{
	const value = track('server');
	<div>
		<input value="server" ref={bindValue(value)} />
		<output>{JSON.stringify(value.value)}</output>
	</div>
}

export function ExternalBinding({ binding }) {
	return <input value="server" ref={binding} />;
}
