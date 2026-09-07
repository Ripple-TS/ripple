<script module>
	let update;
	export function bumpAt1() {
		update?.();
	}
</script>

<script>
	import C2 from './C2.svelte';

	let value = $state(0);
	update = () => {
		value += 1;
	};
</script>

<div class="c">1:{value} <C2 /></div>
