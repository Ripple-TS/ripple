<script module>
	let update;
	export function bumpAt81() {
		update?.();
	}
</script>

<script>
	import C82 from './C82.svelte';

	let value = $state(0);
	update = () => {
		value += 1;
	};
</script>

<div class="c">81:{value} <C82 /></div>
