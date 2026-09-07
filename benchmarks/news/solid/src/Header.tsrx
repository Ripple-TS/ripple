import { createSignal } from 'solid-js';

// Solid analogue of the octane Header: a component with reactive state
// (createSignal — Solid's fine-grained primitive, vs octane's useState).
// The theme toggle gives a visible interactivity proof after hydration; the
// markup is byte-identical to the octane fixture for a fair comparison.
export function Header() @{
	const [dark, setDark] = createSignal(false);
	<header class={dark() ? 'masthead dark' : 'masthead'}>
		<h1 class="logo">{'The Octane Times'}</h1>
		<button id="theme" class="theme" onClick={() => setDark(!dark())}>
			{dark() ? 'Light mode' : 'Dark mode'}
		</button>
	</header>
}
