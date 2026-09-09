import { ARTICLES } from './data.js';
import { Header } from './Header.tsrx';

type Article = {
	id: number;
	section: string;
	title: string;
	byline: string;
	lead: string;
	body1: string;
	body2: string;
	points: number;
};

// Original-Ripple analogue of the octane App: a nested component (Header) +
// a `@for` feed of article cards + footer. Same markup + dataset as the other
// targets so the bench compares pure SSR-render + hydration cost across
// frameworks. The `Article` type lets the compiler prove every `{expr}` hole
// is a string, so each lowers to a plain text node (`set_text`) instead of an
// `expression()` block with hydration markers.
export function App() @{
	<div class="site">
		<Header />
		<main class="feed">
			@for (const a of ARTICLES as Article[]; index i) {
				<article class="card">
					<span class="section">{a.section}</span>
					<h2 class="title">{a.title}</h2>
					<p class="byline">{a.byline}</p>
					<p class="lead">{a.lead}</p>
					<p class="body">{a.body1}</p>
					<p class="body">{a.body2}</p>
				</article>
			}
		</main>
		<footer class="foot">{'The Octane Times — SSR + hydration benchmark'}</footer>
	</div>
}
