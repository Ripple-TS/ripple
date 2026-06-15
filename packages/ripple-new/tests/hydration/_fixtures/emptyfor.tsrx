import { useState } from 'ripple-new';

// Empty @for, NO @empty arm, FOLLOWED by a component. The cursor must advance
// past the empty @for's `<!--[-->…<!--]-->` range so the trailing component
// adopts correctly (Bugbot: "zero-item @for misaligns cursor").
function Tail(props) @{
	const [n, setN] = useState(0);
	<button id="tail" onClick={() => setN(n + 1)}>
		{'tail:' + n as string}
	</button>
}

export function FeedOrEmpty(props) @{
	<div id="feed">
		@for (const item of props.items; key item.id) {
			<p class="row">
				{item.name as string}
			</p>
		}
		<Tail />
	</div>
}

// Empty @for WITH an @empty arm — the server's @empty content must be ADOPTED in
// place (not moved or re-mounted via the client path) (Bugbot: "empty for @empty
// breaks hydration").
export function WithEmpty(props) @{
	<ul id="we">
		@for (const item of props.items; key item.id) {
			<li class="row">
				{item.name as string}
			</li>
		} @empty {
			<li class="empty">
				{'No items yet' as string}
			</li>
		}
	</ul>
}
