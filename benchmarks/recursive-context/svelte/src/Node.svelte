<script>
	import Leaf from './Leaf.svelte';
	import Mid from './Mid.svelte';
	import Node from './Node.svelte';

	const MID_PATH = 'LLLLL';
	let { depth, path } = $props();
</script>

{#if depth > 0}
	{#if path === MID_PATH}
		<Mid {depth} {path} />
	{:else}
		<div class="n">
			<Node depth={depth - 1} path={path + 'L'} />
			<Node depth={depth - 1} path={path + 'R'} />
		</div>
	{/if}
{:else}
	<Leaf {path} />
{/if}
