<script module>
	let update;
	export function bumpAt71() {
		update?.();
	}
</script>

<script>
	import C72 from './C72.svelte';

	let value = $state(0);
	update = () => {
		value += 1;
	};
</script>

<div class="c">71:{value} <C72 /></div>
