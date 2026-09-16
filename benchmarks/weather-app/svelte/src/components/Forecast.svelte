<script>
	import ForecastItem from './ForecastItem.svelte';

	let { weatherData = null } = $props();
	let activeForecastIndex = $state(null);

	$effect(() => {
		if (activeForecastIndex === null) return;

		const timer = setTimeout(() => {
			document
				.querySelector('.forecast-item.active')
				?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
		}, 100);

		return () => clearTimeout(timer);
	});

	function handleToggleForecast(index) {
		activeForecastIndex = activeForecastIndex === index ? null : index;
	}
</script>

{#if weatherData}
	<section class="forecast-section">
		<h2 class="section-title">7-Day Forecast</h2>
		<div class="forecast">
			<div class="forecast__list" data-testid="forecast-list">
				{#each weatherData.daily.time as date, index (date)}
					<ForecastItem
						daily={weatherData.daily}
						{index}
						isActive={activeForecastIndex === index}
						onToggle={handleToggleForecast}
					/>
				{/each}
			</div>
		</div>
	</section>
{/if}
