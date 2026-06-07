import { track } from 'ripple';

// Event handling components for hydration testing

export function ClickCounter() @{
	let &[count] = track(0);
	<div>
		<button
			class="increment"
			onClick={() => {
				count++;
			}}
		>{'Increment'}</button>
		<span class="count">{count}</span>
	</div>
}

export function IncrementDecrement() @{
	let &[count] = track(0);
	<div>
		<button
			class="decrement"
			onClick={() => {
				count--;
			}}
		>{'-'}</button>
		<span class="count">{count}</span>
		<button
			class="increment"
			onClick={() => {
				count++;
			}}
		>{'+'}</button>
	</div>
}

export function MultipleEvents() @{
	let &[clicks] = track(0);
	let &[hovers] = track(0);
	<div>
		<button
			class="target"
			onClick={() => {
				clicks++;
			}}
			onMouseEnter={() => {
				hovers++;
			}}
		>{'Target'}</button>
		<span class="clicks">{clicks}</span>
		<span class="hovers">{hovers}</span>
	</div>
}

export function MultiStateUpdate() @{
	let &[count] = track(0);
	let &[lastAction] = track('none');
	const handleClick = () => {
		count++;
		lastAction = 'increment';
	};
	<div>
		<button class="btn" onClick={handleClick}>{'Click'}</button>
		<span class="count">{count}</span>
		<span class="action">{lastAction}</span>
	</div>
}

export function ToggleButton() @{
	let &[isOn] = track(false);
	<div>
		<button
			class="toggle"
			onClick={() => {
				isOn = !isOn;
			}}
		>
			{isOn ? 'ON' : 'OFF'}
		</button>
	</div>
}

export function ChildButton(props: { onClick: () => void; label: string }) @{
	<button class="child-btn" onClick={props.onClick}>{props.label}</button>
}

export function ParentWithChildButton() @{
	let &[count] = track(0);
	<div>
		<ChildButton
			onClick={() => {
				count++;
			}}
			label="Click me"
		/>
		<span class="count">{count}</span>
	</div>
}
