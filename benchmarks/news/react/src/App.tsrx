import { ARTICLES } from './data.js';
import { Header } from './Header.tsrx';

// React analogue of the ripple-new App: a nested component (Header) + a keyed
// `@for` feed of article cards (→ `ARTICLES.map(a => <article key={a.id}>…)`) +
// footer. React's `.map` passes each item by value, so `a.title` is direct
// (no accessor, unlike Solid's keyed <For>). Same markup + dataset as the other
// targets so the bench compares pure SSR-render + hydration cost.
export function App() @{
	<div className="site">
		<Header />
		<main className="feed">
			@for (const a of ARTICLES; key a.id) {
				<article className="card">
					<span className="section">{a.section}</span>
					<h2 className="title">{a.title}</h2>
					<p className="byline">{a.byline}</p>
					<p className="lead">{a.lead}</p>
					<p className="body">{a.body1}</p>
					<p className="body">{a.body2}</p>
				</article>
			}
		</main>
		<footer className="foot">{'The Ripple Times — SSR + hydration benchmark'}</footer>
	</div>
}
