import { createMemo } from 'solid-js';
import type { CardData, CardSlot } from './data';

// Streaming product page — Solid 2.0 target. Same DOM shape + data schedule as
// the octane fixture; `@try`/`@pending` lowers to `<Loading fallback>` via
// @tsrx/solid, and the async read follows Solid 2.0's model: a
// `createMemo(() => promise)` computation whose reads suspend until the
// promise resolves (caught by the enclosing Loading boundary). The suspending
// reads live in a CHILD component of the boundary, matching the other targets.
// No `; key` on the @for loops (Solid's value-form <For>), matching the
// benchmarks/news solid fixture convention.

function CardBody(props: { promise: Promise<CardData> }) @{
	const data = createMemo(() => props.promise);
	<article class="card">
		<h3 class="title">{data().title}</h3>
		<p class="sub">{data().subtitle}</p>
		<ul class="specs">
			@for (const it of data().items) {
				<li class="spec">
					<span class="label">{it.label}</span>
					<span class="value">{it.value}</span>
				</li>
			}
		</ul>
		<div class="meta">
			<span class="tag">{data().tag}</span>
			<span class="note">{data().note}</span>
		</div>
	</article>
}

function Card(props: { slot: CardSlot }) @{
	<section class="slot">
		@try {
			<CardBody promise={props.slot.promise} />
		} @pending {
			<div class="skeleton">
				<div class="bar"></div>
				<div class="bar"></div>
				<div class="bar"></div>
			</div>
		}
	</section>
}

export function App(props: { cards: CardSlot[] }) @{
	<div class="site">
		<header class="masthead">
			<h1 class="brand">{'Octane Outfitters'}</h1>
			<p class="tagline">{'streaming SSR benchmark storefront'}</p>
			<nav class="nav">
				<ul class="links">
					@for (const n of ['home', 'new', 'sale', 'gear', 'parts', 'labs', 'blog', 'help']) {
						<li class="link">
							<a href={'/' + n}>{n}</a>
						</li>
					}
				</ul>
			</nav>
		</header>
		<section class="hero">
			<h2 class="pitch">{'Ten cards, one stream'}</h2>
			<p
				class="blurb"
			>{'The shell flushes immediately; each card streams when its data resolves.'}</p>
			<div class="stats">
				<div class="stat">
					<span class="num">{'10'}</span>
					<span class="cap">{'boundaries'}</span>
				</div>
				<div class="stat">
					<span class="num">{'50'}</span>
					<span class="cap">{'shell elements'}</span>
				</div>
				<div class="stat">
					<span class="num">{'20'}</span>
					<span class="cap">{'elements per card'}</span>
				</div>
			</div>
		</section>
		<main class="grid">
			@for (const c of props.cards) {
				<Card slot={c} />
			}
		</main>
		<footer class="foot">
			<p class="fine">{'Octane Outfitters — streaming SSR benchmark'}</p>
			<small class="legal">{'same DOM shape and data schedule across all frameworks'}</small>
		</footer>
	</div>
}
