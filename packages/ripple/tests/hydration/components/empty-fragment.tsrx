import { track } from 'ripple';

function Row() @{
	<span data-row="">first</span>
}

export function Empty() @{
	<></>
}

export function TrailingInElement() @{
	<div>
		<Row />
		<Empty />
	</div>
}

export function TrailingInFragment() @{
	<>
		<Row />
		<Empty />
	</>
}

export function LeadingInElement() @{
	<div>
		<Empty />
		<Row />
	</div>
}

export function LeadingInFragment() @{
	<>
		<Empty />
		<Row />
	</>
}

export function ConsecutiveInElement() @{
	<div>
		<Empty />
		<Empty />
		<Row />
		<Empty />
		<Empty />
	</div>
}

export function ConsecutiveInFragment() @{
	<>
		<Empty />
		<Empty />
		<Row />
		<Empty />
		<Empty />
	</>
}

export function BetweenStaticSiblings() @{
	<div>
		<span data-row="">first</span>
		<Empty />
		<b>last</b>
	</div>
}

export function NestedEmpty() @{
	<>
		<>
			{/* empty */}
		</>
	</>
}

export function ToggleEmpty() @{
	const show = track(true);
	<>
		<button onClick={() => (show.value = !show.value)}>toggle</button>
		<Row />
		@if (show.value) {
			<Empty />
		} @else {
			<b>child</b>
		}
	</>
}
