import { use } from 'octane';
import type { CardData, CardSlot } from './data';

// Streaming product page — octane target. A synchronous shell (~50 elements:
// masthead + nav + hero + grid chrome) plus CARD_COUNT `@try` boundaries whose
// bodies suspend on a per-card data promise (created once per render in
// entry-server.ts and passed down as props). Same DOM shape as the react /
// solid / ripple targets; only the data-acquisition glue differs (`use()`
// here). The suspending read lives in a CHILD component of the `@try` — the
// cross-framework-portable pattern (React's `use()` must run inside a
// component under `<Suspense>`).

function CardBody(props: { promise: Promise<CardData> }) @{
	const data = use(props.promise);
	<article class="card">
		<h3 class="title">{data.title as string}</h3>
		<p class="sub">{data.subtitle as string}</p>
		<ul class="specs">
			@for (const it of data.items; key it.label) {
				<li class="spec">
					<span class="label">{it.label as string}</span>
					<span class="value">{it.value as string}</span>
				</li>
			}
		</ul>
		<div class="meta">
			<span class="tag">{data.tag as string}</span>
			<span class="note">{data.note as string}</span>
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
			<h1 class="brand">{'Octane Outfitters' as string}</h1>
			<p class="tagline">{'streaming SSR benchmark storefront' as string}</p>
			<nav class="nav">
				<ul class="links">
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
						<li class="link">
							<a href={'/' + n}>{n as string}</a>
						</li>
					}
				</ul>
			</nav>
		</header>
		<section class="hero">
			<h2 class="pitch">{'Ten cards, one stream' as string}</h2>
			<p
				class="blurb"
			>{'The shell flushes immediately; each card streams when its data resolves.' as string}</p>
			<div class="stats">
				<div class="stat">
					<span class="num">{'10' as string}</span>
					<span class="cap">{'boundaries' as string}</span>
				</div>
				<div class="stat">
					<span class="num">{'50' as string}</span>
					<span class="cap">{'shell elements' as string}</span>
				</div>
				<div class="stat">
					<span class="num">{'20' as string}</span>
					<span class="cap">{'elements per card' as string}</span>
				</div>
			</div>
		</section>
		<main class="grid">
			@for (const c of props.cards; key c.id) {
				<Card slot={c} />
			}
		</main>
		<footer class="foot">
			<p class="fine">{'Octane Outfitters — streaming SSR benchmark' as string}</p>
			<small
				class="legal"
			>{'same DOM shape and data schedule across all frameworks' as string}</small>
		</footer>
	</div>
}
