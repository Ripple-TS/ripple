<script module>
	let update;
	export function bumpAt61() {
		update?.();
	}
</script>

<script>
	import C62 from './C62.svelte';

	let value = $state(0);
	update = () => {
		value += 1;
	};
</script>

<div class="c">61:{value} <C62 /></div>
