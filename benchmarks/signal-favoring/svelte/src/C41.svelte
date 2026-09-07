<script module>
	let update;
	export function bumpAt41() {
		update?.();
	}
</script>

<script>
	import C42 from './C42.svelte';

	let value = $state(0);
	update = () => {
		value += 1;
	};
</script>

<div class="c">41:{value} <C42 /></div>
