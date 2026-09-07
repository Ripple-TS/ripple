<script>
	import Self from './Level.svelte';
	import { fetchData, LEVELS } from './data.js';

	let { level, version } = $props();
</script>

<div class="level" data-level={level}>
	{#await fetchData(level, version)}
		<span class="val">…</span>
	{:then data}
		<span class="val">{data}</span>
	{/await}
	{#if level < LEVELS - 1}
		<Self level={level + 1} {version} />
	{/if}
</div>
