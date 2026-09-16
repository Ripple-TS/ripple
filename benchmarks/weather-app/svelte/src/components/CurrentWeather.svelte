<script>
	import WeatherUtils from '../../../shared/src/WeatherUtils.js';

	let { weatherData = null } = $props();
</script>

{#if weatherData}
	<section class="current-section">
		<h2 class="section-title">Current Weather</h2>
		<div class="weather-card" data-testid="current-weather">
			<div class="current-weather">
				<h3 class="current-weather__location" data-testid="current-location">
					{weatherData.locationName}{weatherData.country ? `, ${weatherData.country}` : ''}
				</h3>
				<div class="current-weather__main">
					<div class="current-weather__icon" data-testid="current-icon">
						{WeatherUtils.getWeatherIcon(
							weatherData.current.weather_code,
							weatherData.current.is_day,
						)}
					</div>
					<div class="current-weather__temp-group">
						<div class="current-weather__temp" data-testid="current-temperature">
							{WeatherUtils.formatTemperature(weatherData.current.temperature_2m)}
						</div>
						<div
							class={`current-weather__condition ${WeatherUtils.getConditionClass(weatherData.current.weather_code)}`}
							data-testid="current-condition"
						>
							{WeatherUtils.getWeatherDescription(weatherData.current.weather_code)}
						</div>
					</div>
				</div>

				<div class="current-weather__details">
					<div class="weather-detail">
						<div class="weather-detail__label">Feels like</div>
						<div class="weather-detail__value" data-testid="feels-like">
							{WeatherUtils.formatTemperature(weatherData.current.apparent_temperature)}
						</div>
					</div>
					<div class="weather-detail">
						<div class="weather-detail__label">Humidity</div>
						<div class="weather-detail__value" data-testid="humidity">
							{WeatherUtils.formatPercentage(weatherData.current.relative_humidity_2m)}
						</div>
					</div>
					<div class="weather-detail">
						<div class="weather-detail__label">Wind Speed</div>
						<div class="weather-detail__value" data-testid="wind-speed">
							{WeatherUtils.formatWindSpeed(weatherData.current.wind_speed_10m)}
						</div>
					</div>
					<div class="weather-detail">
						<div class="weather-detail__label">Pressure</div>
						<div class="weather-detail__value" data-testid="pressure">
							{WeatherUtils.formatPressure(
								weatherData.current.pressure_msl ?? weatherData.current.surface_pressure,
							)}
						</div>
					</div>
					<div class="weather-detail">
						<div class="weather-detail__label">Cloud Cover</div>
						<div class="weather-detail__value" data-testid="cloud-cover">
							{WeatherUtils.formatPercentage(weatherData.current.cloud_cover)}
						</div>
					</div>
					<div class="weather-detail">
						<div class="weather-detail__label">Wind Direction</div>
						<div class="weather-detail__value" data-testid="wind-direction">
							{WeatherUtils.getWindDirection(weatherData.current.wind_direction_10m)}
						</div>
					</div>
				</div>
			</div>
		</div>
	</section>
{/if}
