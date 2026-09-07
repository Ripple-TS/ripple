<script>
	import Level from './Level.svelte';

	let version = $state(0);
	window.__bump = () => version++;
</script>

<Level level={0} {version} />
