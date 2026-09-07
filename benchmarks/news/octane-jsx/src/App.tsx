import { ARTICLES } from './data.js';
import { Header } from './Header.tsx';

// JSX (React-style `.tsx`) twin of ../../octane-tsrx/src/App.tsrx: a large news
// document — a nested component (Header) + a keyed feed of article cards + footer.
// The `@for (...; key a.id)` feed becomes `ARTICLES.map((a) => <article key=…>)`,
// `class` → `className`, and the `{… as string}` casts drop. Each card is a
// hole-free template (text only). On hydration octane adopts the server DOM
// (the keyed list path adopts each item's `<!--[-->…<!--]-->` range).
export function App() {
	return (
		<div className="site">
			<Header />
			<main className="feed">
				{ARTICLES.map((a) => (
					<article key={a.id} className="card">
						<span className="section">{a.section}</span>
						<h2 className="title">{a.title}</h2>
						<p className="byline">{a.byline}</p>
						<p className="lead">{a.lead}</p>
						<p className="body">{a.body1}</p>
						<p className="body">{a.body2}</p>
					</article>
				))}
			</main>
			<footer className="foot">The Octane Times — SSR + hydration benchmark</footer>
		</div>
	);
}
