<script module>
	let update;
	export function bumpAt51() {
		update?.();
	}
</script>

<script>
	import C52 from './C52.svelte';

	let value = $state(0);
	update = () => {
		value += 1;
	};
</script>

<div class="c">51:{value} <C52 /></div>
