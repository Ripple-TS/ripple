import { bindChecked, bindFiles, bindGroup, bindIndeterminate, bindValue, track } from 'ripple';

function binding(bind, value, accessors) {
	return accessors ? bind(() => value.value, (next) => (value.value = next)) : bind(value);
}

export function Checkbox({ initial = false, seeded = false, accessors = false }) @{
	const value = track(initial);
	const ref = binding(bindChecked, value, accessors);
	<div>
		@if (seeded) {
			<input type="checkbox" checked ref={ref} />
		} @else {
			<input type="checkbox" ref={ref} />
		}
		<output>{JSON.stringify(value.value)}</output>
		<button onClick={() => (value.value = !value.value)}>toggle</button>
	</div>
}

export function MixedCheckbox({ initial = true, accessors = false }) @{
	const checked = track(false);
	const indeterminate = track(initial);
	<div>
		<input
			type="checkbox"
			ref={[
				binding(bindChecked, checked, accessors),
				binding(bindIndeterminate, indeterminate, accessors),
			]}
		/>
		<output>{JSON.stringify([checked.value, indeterminate.value])}</output>
		<button onClick={() => (indeterminate.value = !indeterminate.value)}>toggle</button>
	</div>
}

function LastCheckbox({ ref }) {
	return <input type="checkbox" checked value="c" ref={ref} />;
}

export function CheckboxGroup({ initial = ['a', 'c'], accessors = false }) @{
	const value = track(initial);
	const ref = binding(bindGroup, value, accessors);
	<div>
		<input type="checkbox" checked value="a" ref={ref} />
		<input type="checkbox" value="b" ref={ref} />
		<LastCheckbox ref={ref} />
		<output>{JSON.stringify(value.value)}</output>
		<button onClick={() => (value.value = initial)}>reset</button>
	</div>
}

export function RadioGroup({ initial = 'b', accessors = false }) @{
	const value = track(initial);
	const ref = binding(bindGroup, value, accessors);
	<div>
		<input type="radio" name="choice" value="a" ref={ref} />
		<input type="radio" name="choice" checked value="b" ref={ref} />
		<input type="radio" name="choice" value="c" ref={ref} />
		<output>{JSON.stringify(value.value)}</output>
		<button onClick={() => (value.value = initial)}>reset</button>
	</div>
}

export function Select({ initial = 2, size = 0, accessors = false }) @{
	const value = track(initial);
	<div>
		<select size={size} ref={binding(bindValue, value, accessors)}>
			<option disabled value={0}>Disabled</option>
			<optgroup disabled label="Disabled group">
				<option value={-1}>Disabled child</option>
			</optgroup>
			<option value={1}>One</option>
			<option value={2}>Two</option>
			<option value={3}>Three</option>
		</select>
		<output>{JSON.stringify(value.value)}</output>
		<button onClick={() => (value.value = initial)}>reset</button>
	</div>
}

export function SeededSelect({ initial = 'b', accessors = false }) @{
	const value = track(initial);
	<div>
		<select ref={binding(bindValue, value, accessors)}>
			<option value="a">A</option>
			<option selected value="b">B</option>
			<option value="c">C</option>
		</select>
		<output>{JSON.stringify(value.value)}</output>
		<button onClick={() => (value.value = initial)}>reset</button>
	</div>
}

export function MultiSelect({ initial = ['a', 'c'], accessors = false }) @{
	const value = track(initial);
	<div>
		<select multiple ref={binding(bindValue, value, accessors)}>
			<option selected value="a">A</option>
			<option value="b">B</option>
			<option selected value="c">C</option>
		</select>
		<output>{JSON.stringify(value.value)}</output>
		<button onClick={() => (value.value = initial)}>reset</button>
	</div>
}

export function Files({ initial = null, next = null, accessors = false }) @{
	const value = track(initial);
	<div>
		<input type="file" multiple ref={binding(bindFiles, value, accessors)} />
		<output>
			{value.value ? Array.from(value.value, (file) => file.name).join(',') : 'none'}
		</output>
		<button onClick={() => (value.value = next)}>update</button>
	</div>
}
