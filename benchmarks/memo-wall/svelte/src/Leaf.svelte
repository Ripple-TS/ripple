<script>
	import { getContext, untrack } from 'svelte';

	let { wall } = $props();
	const wallKey = untrack(() => wall);
	const theme = getContext('theme' + wallKey);
	// The probe runs in the reactive text expression: once at creation and once
	// per theme change, the fine-grained equivalent of a Leaf re-render.
	function probe() {
		window.__renders['leaf' + wallKey]++;
		return theme.value;
	}
</script>

<span class="leaf">{probe()}</span>
