import { track } from 'ripple';

export function StaticValue() {
	return <textarea value="hello & <world>" />;
}

export function Value({ initial, next }) @{
	const text = track(initial);
	<form>
		<textarea value={text.value} />
		<button type="button" onClick={() => (text.value = next)}>update</button>
	</form>
}

export function Child({ initial, next }) @{
	const text = track(initial);
	<form>
		<textarea>{text.value}</textarea>
		<button type="button" onClick={() => (text.value = next)}>update</button>
	</form>
}

export function MixedChildren({ initial, next }) @{
	const text = track(initial);
	const read = () => text.value;
	<form>
		<textarea>before:{read()}{text.value}:after</textarea>
		<button type="button" onClick={() => (text.value = next)}>update</button>
	</form>
}

export function StaticChild() {
	return <textarea>hello &amp; &lt;world&gt;</textarea>;
}

export function SpreadValue({ initial, next }) @{
	const text = track(initial);
	<form>
		<textarea {...{ value: text.value }} />
		<button type="button" onClick={() => (text.value = next)}>update</button>
	</form>
}
