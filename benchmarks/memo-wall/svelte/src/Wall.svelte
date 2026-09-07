<script>
	import { setContext, untrack } from 'svelte';
	import Row from './Row.svelte';
	import { selectRow } from './ops.js';

	let { wall, title, initialItems, bindWall } = $props();
	const wallKey = untrack(() => wall);
	const register = untrack(() => bindWall);
	let items = $state.raw(untrack(() => initialItems));
	let tick = $state(0);
	// A stable reactive object lets every Leaf subscribe directly to value.
	let theme = $state({ value: 't0' });
	setContext('theme' + wallKey, theme);
	register({
		setItems: (value) => (items = value),
		setTick: (value) => (tick = value),
		setTheme: (value) => (theme.value = value),
	});
</script>

<section class="wall" id={'wall-' + wall.toLowerCase()}>
	<h2>{title}<span class="tick">{tick}</span></h2>
	<div class="rows">
		{#each items as item (item)}
			<Row id={item.id} label={item.label} value={item.value} {wall} onSelect={selectRow} />
		{/each}
	</div>
</section>
