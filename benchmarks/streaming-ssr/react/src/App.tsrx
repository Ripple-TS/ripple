import { use } from 'react';
import type { CardData, CardSlot } from './data';

// Streaming product page — React 19 target. Same DOM shape + data schedule as
// the octane fixture; `@try`/`@pending` lowers to `<Suspense fallback>` via
// @tsrx/react, and the suspending `use(promise)` read lives in a CHILD
// component of the boundary (React requires `use()` to run inside a component
// under the Suspense boundary).

function CardBody(props: { promise: Promise<CardData> }) @{
	const data = use(props.promise);
	<article className="card">
		<h3 className="title">{data.title}</h3>
		<p className="sub">{data.subtitle}</p>
		<ul className="specs">
			@for (const it of data.items; key it.label) {
				<li className="spec">
					<span className="label">{it.label}</span>
					<span className="value">{it.value}</span>
				</li>
			}
		</ul>
		<div className="meta">
			<span className="tag">{data.tag}</span>
			<span className="note">{data.note}</span>
		</div>
	</article>
}

function Card(props: { slot: CardSlot }) @{
	<section className="slot">
		@try {
			<CardBody promise={props.slot.promise} />
		} @pending {
			<div className="skeleton">
				<div className="bar"></div>
				<div className="bar"></div>
				<div className="bar"></div>
			</div>
		}
	</section>
}

export function App(props: { cards: CardSlot[] }) @{
	<div className="site">
		<header className="masthead">
			<h1 className="brand">{'Octane Outfitters'}</h1>
			<p className="tagline">{'streaming SSR benchmark storefront'}</p>
			<nav className="nav">
				<ul className="links">
					@for (const n of [
						'home',
						'new',
						'sale',
						'gear',
						'parts',
						'labs',
						'blog',
						'help',
					]; key n) {
						<li className="link">
							<a href={'/' + n}>{n}</a>
						</li>
					}
				</ul>
			</nav>
		</header>
		<section className="hero">
			<h2 className="pitch">{'Ten cards, one stream'}</h2>
			<p
				className="blurb"
			>{'The shell flushes immediately; each card streams when its data resolves.'}</p>
			<div className="stats">
				<div className="stat">
					<span className="num">{'10'}</span>
					<span className="cap">{'boundaries'}</span>
				</div>
				<div className="stat">
					<span className="num">{'50'}</span>
					<span className="cap">{'shell elements'}</span>
				</div>
				<div className="stat">
					<span className="num">{'20'}</span>
					<span className="cap">{'elements per card'}</span>
				</div>
			</div>
		</section>
		<main className="grid">
			@for (const c of props.cards; key c.id) {
				<Card slot={c} />
			}
		</main>
		<footer className="foot">
			<p className="fine">{'Octane Outfitters — streaming SSR benchmark'}</p>
			<small className="legal">{'same DOM shape and data schedule across all frameworks'}</small>
		</footer>
	</div>
}
