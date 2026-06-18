import { track } from 'ripple';

// Original-Ripple analogue of the ripple-new Header: reactive state via Ripple's
// `track` (the `&[dark]` destructure binds a Tracked as a directly read/written
// reactive local — vs ripple-new's `useState` / Solid's `createSignal`). Same
// markup as the other targets. The theme toggle is the post-hydration interactivity proof.
export function Header() @{
	let &[dark] = track(false);
	<header class={dark ? 'masthead dark' : 'masthead'}>
		<h1 class="logo">{'The Ripple Times'}</h1>
		<button
			id="theme"
			class="theme"
			onClick={() => {
				dark = !dark;
			}}
		>
			{dark ? 'Light mode' : 'Dark mode'}
		</button>
	</header>
}
