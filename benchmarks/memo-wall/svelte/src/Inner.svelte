<script>
	import { untrack } from 'svelte';
	import Leaf from './Leaf.svelte';

	let { value, wall } = $props();
	const wallKey = untrack(() => wall);
	window.__renders['inner' + wallKey]++;
</script>

<span class="inner">{value}<Leaf {wall} /></span>
