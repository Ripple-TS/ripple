<script>
	import Row from './Row.svelte';
	import { bindHandlers, initialItems } from './ops.js';

	let items = $state.raw(initialItems());
	let tick = $state(0);
	bindHandlers({
		setItems(next) {
			items = typeof next === 'function' ? next(items) : next;
		},
		setTick(next) {
			tick = typeof next === 'function' ? next(tick) : next;
		},
	});
</script>

<div>
	<div class="tick">{tick}</div>
	<table class="test-data">
		<tbody>
			{#each items as item (item.id)}
				<Row id={item.id} label={item.label} value={item.value} probe={item.probe} />
			{/each}
		</tbody>
	</table>
</div>
