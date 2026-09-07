<script module>
	let update;
	export function bumpAt91() {
		update?.();
	}
</script>

<script>
	import C92 from './C92.svelte';

	let value = $state(0);
	update = () => {
		value += 1;
	};
</script>

<div class="c">91:{value} <C92 /></div>
