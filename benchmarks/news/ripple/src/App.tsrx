import { ARTICLES } from './data.js';
import { Header } from './Header.tsrx';

// Original-Ripple analogue of the ripple-new App: a nested component (Header) +
// a `@for` feed of article cards + footer. Same markup + dataset as the other
// targets so the bench compares pure SSR-render + hydration cost across
// frameworks. Ripple renders `{expr}` holes directly (no `as string` needed).
export function App() @{
	<div class="site">
		<Header />
		<main class="feed">
			@for (const a of ARTICLES; index i) {
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
		<footer class="foot">{'The Ripple Times — SSR + hydration benchmark'}</footer>
	</div>
}
