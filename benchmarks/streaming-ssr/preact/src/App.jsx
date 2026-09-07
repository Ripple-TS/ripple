import { Suspense } from 'preact/compat';

const records = new WeakMap();

function read(promise) {
	let record = records.get(promise);
	if (record === undefined) {
		record = { status: 'pending', value: promise };
		promise.then(
			(value) => {
				record.status = 'fulfilled';
				record.value = value;
			},
			(error) => {
				record.status = 'rejected';
				record.value = error;
			},
		);
		records.set(promise, record);
	}
	if (record.status === 'pending' || record.status === 'rejected') throw record.value;
	return record.value;
}

function CardBody({ promise }) {
	const data = read(promise);
	return (
		<article class="card">
			<h3 class="title">{data.title}</h3>
			<p class="sub">{data.subtitle}</p>
			<ul class="specs">
				{data.items.map((item) => (
					<li class="spec" key={item.label}>
						<span class="label">{item.label}</span>
						<span class="value">{item.value}</span>
					</li>
				))}
			</ul>
			<div class="meta">
				<span class="tag">{data.tag}</span>
				<span class="note">{data.note}</span>
			</div>
		</article>
	);
}

function Card({ slot }) {
	return (
		<section class="slot">
			<Suspense
				fallback={
					<div class="skeleton">
						<div class="bar"></div>
						<div class="bar"></div>
						<div class="bar"></div>
					</div>
				}
			>
				<CardBody promise={slot.promise} />
			</Suspense>
		</section>
	);
}

const NAV = ['home', 'new', 'sale', 'gear', 'parts', 'labs', 'blog', 'help'];

export function App({ cards }) {
	return (
		<div class="site">
			<header class="masthead">
				<h1 class="brand">Octane Outfitters</h1>
				<p class="tagline">streaming SSR benchmark storefront</p>
				<nav class="nav">
					<ul class="links">
						{NAV.map((name) => (
							<li class="link" key={name}>
								<a href={'/' + name}>{name}</a>
							</li>
						))}
					</ul>
				</nav>
			</header>
			<section class="hero">
				<h2 class="pitch">Ten cards, one stream</h2>
				<p class="blurb">
					The shell flushes immediately; each card streams when its data resolves.
				</p>
				<div class="stats">
					{[
						['10', 'boundaries'],
						['50', 'shell elements'],
						['20', 'elements per card'],
					].map(([number, caption]) => (
						<div class="stat" key={caption}>
							<span class="num">{number}</span>
							<span class="cap">{caption}</span>
						</div>
					))}
				</div>
			</section>
			<main class="grid">
				{cards.map((slot) => (
					<Card slot={slot} key={slot.id} />
				))}
			</main>
			<footer class="foot">
				<p class="fine">Octane Outfitters — streaming SSR benchmark</p>
				<small class="legal">same DOM shape and data schedule across all frameworks</small>
			</footer>
		</div>
	);
}
