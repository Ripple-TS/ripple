<script>
	let { isVisible = false } = $props();
</script>

<div class="loading" data-testid="loading" hidden={!isVisible}>
	<div class="loading__spinner"></div>
	<p>Loading weather data...</p>
</div>
