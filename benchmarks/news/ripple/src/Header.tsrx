import { track } from 'ripple';

// Original-Ripple analogue of the octane Header: reactive state via Ripple's
// `track` (a Tracked local read and written through `.value` — vs octane's
// `useState` / Solid's `createSignal`). Same markup as the other targets. The
// theme toggle is the post-hydration interactivity proof.
export function Header() @{
	const dark = track(false);
	<header class={dark.value ? 'masthead dark' : 'masthead'}>
		<h1 class="logo">{'The Octane Times'}</h1>
		<button
			id="theme"
			class="theme"
			onClick={() => {
				dark.value = !dark.value;
			}}
		>
			{dark.value ? 'Light mode' : 'Dark mode'}
		</button>
	</header>
}
