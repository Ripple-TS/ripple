import { createContext, use, createPortal } from 'ripple-new';

// @if / @else
export function IfElse(props) @{
	<div>
		@if (props.on) {
			<span class="yes">{'on'}</span>
		} @else {
			<span class="no">{'off'}</span>
		}
	</div>
}

// @for with @empty
export function List(props) @{
	<ul>
		@for (const item of props.items) {
			<li>
				{item as string}
			</li>
		} @empty {
			<li class="empty">{'none'}</li>
		}
	</ul>
}

// @switch / @case / @default
export function Switch(props) @{
	<div>
		@switch (props.k) {
			@case 'a': {
				<span>{'A'}</span>
			}
			@case 'b': {
				<span>{'B'}</span>
			}
			@default: {
				<span>{'?'}</span>
			}
		}
	</div>
}

// @try / @pending / @catch — server renders the @pending fallback when the body
// suspends (use(promise)), the @catch arm when it throws.
export function Boundary(props) @{
	<div>
		@try {
			const v = props.read();
			<span class="ok">
				{v as string}
			</span>
		} @pending {
			<span class="loading">{'loading'}</span>
		} @catch (err) {
			<span class="error">
				{err.message as string}
			</span>
		}
	</div>
}

// Context Provider with children (the call convention: Provider invokes
// props.children(scope)).
const Theme = createContext('light');
function Themed() @{
	const t = use(Theme);
	<span class="theme">
		{t as string}
	</span>
}
export function Provided(props) @{
	<Theme.Provider value={props.theme}>
		<Themed />
	</Theme.Provider>
}

// Portal — server emits a site marker; the body renders into a target on the client.
export function WithPortal() @{
	<div id="host">
		{createPortal(
			() => @{
				<div class="modal">{'m'}</div>
			},
			document.body,
		)}
		<span>{'inline'}</span>
	</div>
}
