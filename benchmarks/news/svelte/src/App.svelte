<script>
	import { ARTICLES } from './data.js';
	import Header from './Header.svelte';
</script>

<div class="site">
	<Header />
	<main class="feed">
		{#each ARTICLES as article (article.id)}
			<article class="card">
				<span class="section">{article.section}</span>
				<h2 class="title">{article.title}</h2>
				<p class="byline">{article.byline}</p>
				<p class="lead">{article.lead}</p>
				<p class="body">{article.body1}</p>
				<p class="body">{article.body2}</p>
			</article>
		{/each}
	</main>
	<footer class="foot">The Octane Times — SSR + hydration benchmark</footer>
</div>
