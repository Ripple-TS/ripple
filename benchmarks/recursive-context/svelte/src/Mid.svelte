<script>
	import { setLocalContext } from './context.js';
	import Node from './Node.svelte';
	import { bindMid } from './ops.js';

	let { depth, path } = $props();
	const local = $state({ value: 0 });
	let visible = $state(true);
	setLocalContext(local);
	bindMid(
		() => {
			local.value += 1;
		},
		(next) => {
			visible = next;
		},
	);
</script>

{#if visible}
	<div class="mid">
		<Node depth={depth - 1} path={path + 'L'} />
		<Node depth={depth - 1} path={path + 'R'} />
	</div>
{/if}
