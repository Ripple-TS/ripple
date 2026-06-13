import { useState } from 'ripple-new';

// <{expr}> dynamic-tag syntax — picks the rendered component from an
// expression. Slot identity is stable; swapping the expression remounts
// just the slot's subtree, no parent re-render needed.

function Red(props) @{
	<span style="padding: 6px 12px; background: #fee2e2; color: #991b1b; border-radius: 4px">
		{'red: ' + props.label as string}
	</span>
}

function Blue(props) @{
	<span style="padding: 6px 12px; background: #dbeafe; color: #1e40af; border-radius: 4px">
		{'blue: ' + props.label as string}
	</span>
}

function Green(props) @{
	<span style="padding: 6px 12px; background: #d1fae5; color: #065f46; border-radius: 4px">
		{'green: ' + props.label as string}
	</span>
}

const LEAVES = { red: Red, blue: Blue, green: Green };

export function DynamicDemo() @{
	const [which, setWhich] = useState('red');
	const Comp = LEAVES[which];

	<div>
		<h2 class="demo-title">{'<{expr}> dynamic tag'}</h2>
		<p
			class="demo-blurb"
		>{'Pick the rendered component from an expression. Swapping triggers a slot remount, not a parent re-render.'}</p>
		<div class="row">
			<button class="btn" onClick={() => setWhich('red')}>{'red'}</button>
			<button class="btn" onClick={() => setWhich('blue')}>{'blue'}</button>
			<button class="btn" onClick={() => setWhich('green')}>{'green'}</button>
		</div>
		<div class="panel" style="margin-top: 12px">
			<{Comp} label="live swap" />
		</div>
	</div>
}
