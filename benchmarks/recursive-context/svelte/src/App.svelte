<script>
	import { DEFAULT_LOCAL, setLocalContext, setRootContext } from './context.js';
	import Node from './Node.svelte';
	import { bindRoot } from './ops.js';

	let { depth } = $props();
	const root = $state({ value: 0 });
	setRootContext(root);
	setLocalContext(DEFAULT_LOCAL);
	bindRoot(() => {
		root.value += 1;
	});
</script>

<Node {depth} path="" />
