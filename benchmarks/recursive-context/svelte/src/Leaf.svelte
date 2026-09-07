<script>
	import { getLocalContext, getRootContext } from './context.js';

	let { path } = $props();
	const root = getRootContext();
	const local = getLocalContext();
</script>

<span class="leaf">{path + '|' + root.value + ':' + local.value}</span>
