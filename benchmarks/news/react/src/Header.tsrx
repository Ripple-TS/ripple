import { useState } from 'react';

// React version of the shared news Header: reactive state via React's own
// useState (all targets share a React-shape authoring, so the fixtures are identical
// bar the import + `className`). React wants `className` (it only auto-converts
// `class` during CSS-scope injection, which these style-free components skip);
// it renders to the same `class` DOM attribute as the other targets. The theme
// toggle gives a visible interactivity proof after hydration.
export function Header() @{
	const [dark, setDark] = useState(false);
	<header className={dark ? 'masthead dark' : 'masthead'}>
		<h1 className="logo">{'The Ripple Times'}</h1>
		<button id="theme" className="theme" onClick={() => setDark(!dark)}>
			{dark ? 'Light mode' : 'Dark mode'}
		</button>
	</header>
}
