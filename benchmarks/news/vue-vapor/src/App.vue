<script setup vapor>
// Vue Vapor analogue of the octane App: a nested component (Header) + a keyed
// v-for feed of article cards + footer. Same markup + dataset as the other
// targets so the bench compares pure SSR-render + hydration cost.
import Header from './Header.vue';
import { ARTICLES } from './data.js';
</script>

<template>
	<div class="site">
		<Header />
		<main class="feed">
			<article v-for="a of ARTICLES" :key="a.id" class="card">
				<span class="section">{{ a.section }}</span>
				<h2 class="title">{{ a.title }}</h2>
				<p class="byline">{{ a.byline }}</p>
				<p class="lead">{{ a.lead }}</p>
				<p class="body">{{ a.body1 }}</p>
				<p class="body">{{ a.body2 }}</p>
			</article>
		</main>
		<footer class="foot">The Octane Times — SSR + hydration benchmark</footer>
	</div>
</template>
