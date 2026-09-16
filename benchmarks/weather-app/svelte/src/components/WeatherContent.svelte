<script>
	import CurrentWeather from './CurrentWeather.svelte';
	import Forecast from './Forecast.svelte';

	let { isVisible = false, weatherData = null } = $props();
</script>

<div class="weather-content" data-testid="weather-content" hidden={!isVisible}>
	<div class="weather-layout">
		<CurrentWeather {weatherData} />
		<Forecast {weatherData} />
	</div>
</div>
