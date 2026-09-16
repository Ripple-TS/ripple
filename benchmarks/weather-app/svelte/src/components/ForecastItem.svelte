<script>
	import WeatherUtils from '../../../shared/src/WeatherUtils.js';

	let { daily, index, isActive = false, onToggle } = $props();
	let dayName = $derived(WeatherUtils.formatDate(daily.time[index]));
	let weatherCode = $derived(daily.weather_code[index]);
	let high = $derived(daily.temperature_2m_max[index]);
	let low = $derived(daily.temperature_2m_min[index]);
	let condition = $derived(WeatherUtils.getWeatherDescription(weatherCode));
	let icon = $derived(WeatherUtils.getWeatherIcon(weatherCode));

	function handleClick() {
		onToggle(index);
	}

	function handleKeyDown(event) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			onToggle(index);
		}
	}
</script>

<div
	class="forecast-item"
	class:active={isActive}
	data-testid="forecast-item"
	tabindex="0"
	role="button"
	aria-label={`View detailed forecast for ${dayName}`}
	onclick={handleClick}
	onkeydown={handleKeyDown}
>
	<div class="forecast-item__day">{dayName}</div>
	<div class="forecast-item__icon">{icon}</div>
	<div class="forecast-item__info">
		<div class="forecast-item__condition">{condition}</div>
		<div class="forecast-item__temps" data-testid="forecast-temps">
			<span class="forecast-item__high" data-testid="forecast-high">
				{WeatherUtils.formatTemperature(high)}
			</span>
			<span class="forecast-item__low" data-testid="forecast-low">
				{WeatherUtils.formatTemperature(low)}
			</span>
		</div>
	</div>

	{#if isActive}
		<div class="forecast-item__details">
			<div class="forecast-detail-item">
				<div class="forecast-detail-item__label">Sunrise</div>
				<div class="forecast-detail-item__value">
					{WeatherUtils.formatTime(daily.sunrise[index])}
				</div>
			</div>
			<div class="forecast-detail-item">
				<div class="forecast-detail-item__label">Sunset</div>
				<div class="forecast-detail-item__value">
					{WeatherUtils.formatTime(daily.sunset[index])}
				</div>
			</div>
			<div class="forecast-detail-item">
				<div class="forecast-detail-item__label">Rain</div>
				<div class="forecast-detail-item__value">{daily.rain_sum[index].toFixed(1)} mm</div>
			</div>
			<div class="forecast-detail-item">
				<div class="forecast-detail-item__label">UV Index</div>
				<div class="forecast-detail-item__value">{daily.uv_index_max[index].toFixed(1)}</div>
			</div>
			<div class="forecast-detail-item">
				<div class="forecast-detail-item__label">Precipitation</div>
				<div class="forecast-detail-item__value">
					{WeatherUtils.formatPercentage(daily.precipitation_probability_max[index])}
				</div>
			</div>
			<div class="forecast-detail-item">
				<div class="forecast-detail-item__label">Temperature</div>
				<div class="forecast-detail-item__value">
					{WeatherUtils.formatTemperature(daily.temperature_2m_min[index])} to {WeatherUtils.formatTemperature(
						daily.temperature_2m_max[index],
					)}
				</div>
			</div>
		</div>
	{/if}
</div>
