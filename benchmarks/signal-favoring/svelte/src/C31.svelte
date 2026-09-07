<script module>
	let update;
	export function bumpAt31() {
		update?.();
	}
</script>

<script>
	import C32 from './C32.svelte';

	let value = $state(0);
	update = () => {
		value += 1;
	};
</script>

<div class="c">31:{value} <C32 /></div>
