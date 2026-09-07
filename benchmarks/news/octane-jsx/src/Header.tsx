import { useState } from 'octane';

// JSX twin of ../../octane-tsrx/src/Header.tsrx. A FULL component (has a hook →
// not a hookless "lite" slot) so it hydrates via the nested-component path. The
// theme toggle gives a visible interactivity proof after hydration (the bench's
// correctness check clicks `#theme` and asserts the masthead className flips).
export function Header() {
	const [dark, setDark] = useState(false);
	return (
		<header className={dark ? 'masthead dark' : 'masthead'}>
			<h1 className="logo">The Octane Times</h1>
			<button id="theme" className="theme" onClick={() => setDark(!dark)}>
				{dark ? 'Light mode' : 'Dark mode'}
			</button>
		</header>
	);
}
