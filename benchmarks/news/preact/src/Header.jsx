import { useState } from 'preact/hooks';

export function Header() {
	const [dark, setDark] = useState(false);
	return (
		<header class={dark ? 'masthead dark' : 'masthead'}>
			<h1 class="logo">The Octane Times</h1>
			<button id="theme" class="theme" onClick={() => setDark(!dark)}>
				{dark ? 'Light mode' : 'Dark mode'}
			</button>
		</header>
	);
}
