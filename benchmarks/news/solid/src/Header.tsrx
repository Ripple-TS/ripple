import { createSignal } from 'solid-js';

// Solid analogue of the ripple-new Header: a component with reactive state
// (createSignal — Solid's fine-grained primitive, vs ripple-new's useState).
// The theme toggle gives a visible interactivity proof after hydration; the
// markup is byte-identical to the ripple-new fixture for a fair comparison.
export function Header() @{
	const [dark, setDark] = createSignal(false);
	<header class={dark() ? 'masthead dark' : 'masthead'}>
		<h1 class="logo">{'The Ripple Times'}</h1>
		<button id="theme" class="theme" onClick={() => setDark(!dark())}>
			{dark() ? 'Light mode' : 'Dark mode'}
		</button>
	</header>
}
