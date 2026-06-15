import { useState } from 'ripple-new';

// A FULL component (has a hook → not a hookless "lite" slot) so it hydrates via
// the nested-component path (M1). The theme toggle gives a visible interactivity
// proof after hydration.
export function Header() @{
	const [dark, setDark] = useState(false);
	<header class={dark ? 'masthead dark' : 'masthead'}>
		<h1 class="logo">
			{'The Ripple Times' as string}
		</h1>
		<button id="theme" class="theme" onClick={() => setDark(!dark)}>
			{(dark ? 'Light mode' : 'Dark mode') as string}
		</button>
	</header>
}
