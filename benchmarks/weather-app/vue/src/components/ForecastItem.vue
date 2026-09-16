<script setup>
import { computed } from 'vue';
import WeatherUtils from '../../../shared/src/WeatherUtils.js';

const props = defineProps({
	daily: { type: Object, required: true },
	index: { type: Number, required: true },
	isActive: { type: Boolean, required: true },
});
const emit = defineEmits(['toggle']);
const forecastData = computed(() => ({
	dayName: WeatherUtils.formatDate(props.daily.time[props.index]),
	weatherCode: props.daily.weather_code[props.index],
	high: props.daily.temperature_2m_max[props.index],
	low: props.daily.temperature_2m_min[props.index],
}));
const condition = computed(() =>
	WeatherUtils.getWeatherDescription(forecastData.value.weatherCode),
);
const icon = computed(() => WeatherUtils.getWeatherIcon(forecastData.value.weatherCode));
const handleKeyDown = (event) => {
	if (event.key === 'Enter' || event.key === ' ') {
		event.preventDefault();
		emit('toggle');
	}
};
</script>

<template>
	<div
		:class="`forecast-item ${isActive ? 'active' : ''}`"
		data-testid="forecast-item"
		tabindex="0"
		role="button"
		:aria-label="`View detailed forecast for ${forecastData.dayName}`"
		@click="emit('toggle')"
		@keydown="handleKeyDown"
	>
		<div class="forecast-item__day">{{ forecastData.dayName }}</div>
		<div class="forecast-item__icon">{{ icon }}</div>
		<div class="forecast-item__info">
			<div class="forecast-item__condition">{{ condition }}</div>
			<div class="forecast-item__temps" data-testid="forecast-temps">
				<span class="forecast-item__high" data-testid="forecast-high">
					{{ WeatherUtils.formatTemperature(forecastData.high) }}
				</span>
				<span class="forecast-item__low" data-testid="forecast-low">
					{{ WeatherUtils.formatTemperature(forecastData.low) }}
				</span>
			</div>
		</div>

		<div v-if="isActive" class="forecast-item__details">
			<div class="forecast-detail-item">
				<div class="forecast-detail-item__label">Sunrise</div>
				<div class="forecast-detail-item__value">
					{{ WeatherUtils.formatTime(daily.sunrise[index]) }}
				</div>
			</div>
			<div class="forecast-detail-item">
				<div class="forecast-detail-item__label">Sunset</div>
				<div class="forecast-detail-item__value">
					{{ WeatherUtils.formatTime(daily.sunset[index]) }}
				</div>
			</div>
			<div class="forecast-detail-item">
				<div class="forecast-detail-item__label">Rain</div>
				<div class="forecast-detail-item__value">{{ daily.rain_sum[index].toFixed(1) }} mm</div>
			</div>
			<div class="forecast-detail-item">
				<div class="forecast-detail-item__label">UV Index</div>
				<div class="forecast-detail-item__value">
					{{ daily.uv_index_max[index].toFixed(1) }}
				</div>
			</div>
			<div class="forecast-detail-item">
				<div class="forecast-detail-item__label">Precipitation</div>
				<div class="forecast-detail-item__value">
					{{ WeatherUtils.formatPercentage(daily.precipitation_probability_max[index]) }}
				</div>
			</div>
			<div class="forecast-detail-item">
				<div class="forecast-detail-item__label">Temperature</div>
				<div class="forecast-detail-item__value">
					{{ WeatherUtils.formatTemperature(daily.temperature_2m_min[index]) }} to
					{{ WeatherUtils.formatTemperature(daily.temperature_2m_max[index]) }}
				</div>
			</div>
		</div>
	</div>
</template>
