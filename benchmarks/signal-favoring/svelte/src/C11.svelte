<script module>
	let update;
	export function bumpAt11() {
		update?.();
	}
</script>

<script>
	import C12 from './C12.svelte';

	let value = $state(0);
	update = () => {
		value += 1;
	};
</script>

<div class="c">11:{value} <C12 /></div>
