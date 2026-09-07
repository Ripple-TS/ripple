import { ARTICLES } from './data.js';
import { Header } from './Header.jsx';

export function App() {
	return (
		<div class="site">
			<Header />
			<main class="feed">
				{ARTICLES.map((article) => (
					<article class="card" key={article.id}>
						<span class="section">{article.section}</span>
						<h2 class="title">{article.title}</h2>
						<p class="byline">{article.byline}</p>
						<p class="lead">{article.lead}</p>
						<p class="body">{article.body1}</p>
						<p class="body">{article.body2}</p>
					</article>
				))}
			</main>
			<footer class="foot">The Octane Times — SSR + hydration benchmark</footer>
		</div>
	);
}
