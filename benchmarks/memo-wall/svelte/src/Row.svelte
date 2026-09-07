<script>
	import { untrack } from 'svelte';
	import Inner from './Inner.svelte';

	let { id, label, value, wall, onSelect } = $props();
	const wallKey = untrack(() => wall);
	window.__renders['row' + wallKey]++;
</script>

<div class="item">
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<span class="id" onclick={onSelect}>{id}</span>
	<span class="label">{label}</span>
	<Inner {value} {wall} />
</div>
