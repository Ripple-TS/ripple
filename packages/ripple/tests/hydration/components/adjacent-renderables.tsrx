import { track } from 'ripple';
import type { Renderable, Tracked } from 'ripple';

function Pair(props: { first: Tracked<Renderable>; second: Tracked<Renderable> }) @{
	<section>
		{props.first.value}
		{props.second.value}
	</section>
}

export function AdjacentRenderableProps() @{
	const first = track<Renderable>(
		@{
			<i>one</i>
		},
	);
	const second = track<Renderable>(
		@{
			<b>two</b>
		},
	);
	<>
		<Pair first={first} second={second} />
		<button
			onClick={() => {
				first.value = null;
				second.value = ['three', <em>four</em>];
			}}
		>update</button>
	</>
}

export function MixedRenderableValues() @{
	const first = <i>one</i>;
	const second = <b>two</b>;
	const values = [first, null, '&', second, undefined];
	<section>before:{first}{second}{values}{'<after'}</section>
}
