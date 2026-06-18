import { ARTICLES } from './data.js';
import { Header } from './Header.tsrx';

// A large news document: a nested component (Header → M1) + an @for feed of
// article cards (→ M2). Both hydrate by adopting the server DOM. Each card is a
// hole-free template (text only), so its per-item mount uses the fast raw path.
export function App() @{
	<div class="site">
		<Header />
		<main class="feed">
			@for (const a of ARTICLES; key a.id) {
				<article class="card">
					<span class="section">
						{a.section as string}
					</span>
					<h2 class="title">
						{a.title as string}
					</h2>
					<p class="byline">
						{a.byline as string}
					</p>
					<p class="lead">
						{a.lead as string}
					</p>
					<p class="body">
						{a.body1 as string}
					</p>
					<p class="body">
						{a.body2 as string}
					</p>
				</article>
			}
		</main>
		<footer class="foot">
			{'The Ripple Times — SSR + hydration benchmark' as string}
		</footer>
	</div>
}
