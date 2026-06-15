// SSR Phase 6 (M2) — @for hydration. The server wraps the whole @for in a
// `<!--[-->…<!--]-->` range and EACH item in its own range; the client forBlock
// adopts the outer range and mountItem adopts each item's range (threading the
// hydration cursor), instead of cloning fresh + creating markers.

export function List(props) @{
	<ul id="list">
		@for (const item of props.items; key item.id) {
			<li class="row">
				<span class="name">
					{item.name as string}
				</span>
				<button class="pick" onClick={() => props.onPick(item.id)}>{'pick'}</button>
			</li>
		}
	</ul>
}
