import { track } from 'ripple';

function Leaf() @{
	<button class="child">Child</button>
}

function Child() @{
	@for (const key of ['a']; key key) {
		<>
			{Leaf()}
		</>
	}
}

export function ComponentCallCleanup({ native, initialShown }) @{
	const shown = track(initialShown);
	<section>
		<button id="toggle" onClick={() => (shown.value = !shown.value)}>Toggle</button>
		@if (shown.value) {
			@try {
				@if (native) {
					<Child />
				} @else {
					<>
						{Child()}
					</>
				}
			} @catch {
				<button>Error</button>
			}
		}
	</section>
}
