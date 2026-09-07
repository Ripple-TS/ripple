<script module>
	let update;
	export function bumpAt21() {
		update?.();
	}
</script>

<script>
	import C22 from './C22.svelte';

	let value = $state(0);
	update = () => {
		value += 1;
	};
</script>

<div class="c">21:{value} <C22 /></div>
