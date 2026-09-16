<script setup>
import { computed } from 'vue';
import WeatherUtils from '../../../shared/src/WeatherUtils.js';

const props = defineProps({ weatherData: { type: Object, required: true } });
const current = computed(() => props.weatherData.current);
const location = computed(
	() =>
		`${props.weatherData.locationName}${props.weatherData.country ? `, ${props.weatherData.country}` : ''}`,
);
const icon = computed(() =>
	WeatherUtils.getWeatherIcon(current.value.weather_code, current.value.is_day),
);
const condition = computed(() => WeatherUtils.getWeatherDescription(current.value.weather_code));
const conditionClass = computed(() => WeatherUtils.getConditionClass(current.value.weather_code));
</script>

<template>
	<section class="current-section">
		<h2 class="section-title">Current Weather</h2>
		<div class="weather-card" data-testid="current-weather">
			<div class="current-weather">
				<h3 class="current-weather__location" data-testid="current-location">{{ location }}</h3>
				<div class="current-weather__main">
					<div class="current-weather__icon" data-testid="current-icon">{{ icon }}</div>
					<div class="current-weather__temp-group">
						<div class="current-weather__temp" data-testid="current-temperature">
							{{ WeatherUtils.formatTemperature(current.temperature_2m) }}
						</div>
						<div
							:class="`current-weather__condition ${conditionClass}`"
							data-testid="current-condition"
						>
							{{ condition }}
						</div>
					</div>
				</div>

				<div class="current-weather__details">
					<div class="weather-detail">
						<div class="weather-detail__label">Feels like</div>
						<div class="weather-detail__value" data-testid="feels-like">
							{{ WeatherUtils.formatTemperature(current.apparent_temperature) }}
						</div>
					</div>
					<div class="weather-detail">
						<div class="weather-detail__label">Humidity</div>
						<div class="weather-detail__value" data-testid="humidity">
							{{ WeatherUtils.formatPercentage(current.relative_humidity_2m) }}
						</div>
					</div>
					<div class="weather-detail">
						<div class="weather-detail__label">Wind Speed</div>
						<div class="weather-detail__value" data-testid="wind-speed">
							{{ WeatherUtils.formatWindSpeed(current.wind_speed_10m) }}
						</div>
					</div>
					<div class="weather-detail">
						<div class="weather-detail__label">Pressure</div>
						<div class="weather-detail__value" data-testid="pressure">
							{{ WeatherUtils.formatPressure(current.pressure_msl ?? current.surface_pressure) }}
						</div>
					</div>
					<div class="weather-detail">
						<div class="weather-detail__label">Cloud Cover</div>
						<div class="weather-detail__value" data-testid="cloud-cover">
							{{ WeatherUtils.formatPercentage(current.cloud_cover) }}
						</div>
					</div>
					<div class="weather-detail">
						<div class="weather-detail__label">Wind Direction</div>
						<div class="weather-detail__value" data-testid="wind-direction">
							{{ WeatherUtils.getWindDirection(current.wind_direction_10m) }}
						</div>
					</div>
				</div>
			</div>
		</div>
	</section>
</template>
