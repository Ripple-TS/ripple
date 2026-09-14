import { track } from 'ripple';

// Event handling components for hydration testing

export function ClickCounter() @{
	const count = track(0);
	<div>
		<button
			class="increment"
			onClick={() => {
				count.value++;
			}}
		>{'Increment'}</button>
		<span class="count">{count.value}</span>
	</div>
}

export function IncrementDecrement() @{
	const count = track(0);
	<div>
		<button
			class="decrement"
			onClick={() => {
				count.value--;
			}}
		>{'-'}</button>
		<span class="count">{count.value}</span>
		<button
			class="increment"
			onClick={() => {
				count.value++;
			}}
		>{'+'}</button>
	</div>
}

export function MultipleEvents() @{
	const clicks = track(0);
	const hovers = track(0);
	<div>
		<button
			class="target"
			onClick={() => {
				clicks.value++;
			}}
			onMouseEnter={() => {
				hovers.value++;
			}}
		>{'Target'}</button>
		<span class="clicks">{clicks.value}</span>
		<span class="hovers">{hovers.value}</span>
	</div>
}

export function MultiStateUpdate() @{
	const count = track(0);
	const lastAction = track('none');
	const handleClick = () => {
		count.value++;
		lastAction.value = 'increment';
	};
	<div>
		<button class="btn" onClick={handleClick}>{'Click'}</button>
		<span class="count">{count.value}</span>
		<span class="action">{lastAction.value}</span>
	</div>
}

export function ToggleButton() @{
	const isOn = track(false);
	<div>
		<button
			class="toggle"
			onClick={() => {
				isOn.value = !isOn.value;
			}}
		>
			{isOn.value ? 'ON' : 'OFF'}
		</button>
	</div>
}

export function ChildButton(props: { onClick: () => void; label: string }) @{
	<button class="child-btn" onClick={props.onClick}>{props.label}</button>
}

export function ParentWithChildButton() @{
	const count = track(0);
	<div>
		<ChildButton
			onClick={() => {
				count.value++;
			}}
			label="Click me"
		/>
		<span class="count">{count.value}</span>
	</div>
}
