import { ARTICLES } from './data.js';
import { Header } from './Header.tsrx';

// Solid version of the shared news App: a nested component (Header) + a `@for`
// feed of article cards (→ Solid `<For each>`) + footer. Same markup and dataset
// as the other fixtures so the frameworks render near-identical
// documents — the bench compares pure SSR-render + hydration cost.
//
// No `; key` clause (unlike the keyed fixtures): Solid's keyed `<For>`
// passes each item as an ACCESSOR (`a().title`), while the default value `<For>`
// passes it directly (`a.title`) and is both typecheck-clean and runtime-correct.
// Keying only affects UPDATE reconciliation, which this render-once + hydrate
// bench never exercises, so the value form is the faithful choice here.
export function App() @{
	<div class="site">
		<Header />
		<main class="feed">
			@for (const a of ARTICLES) {
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
