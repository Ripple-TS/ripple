<script setup>
import CurrentWeather from './CurrentWeather.vue';
import Forecast from './Forecast.vue';

defineProps({
	isVisible: { type: Boolean, required: true },
	weatherData: { type: Object, default: null },
});
</script>

<template>
	<div class="weather-content" data-testid="weather-content" :hidden="!isVisible">
		<div class="weather-layout">
			<CurrentWeather v-if="weatherData" :weather-data="weatherData" />
			<Forecast v-if="weatherData" :weather-data="weatherData" />
		</div>
	</div>
</template>
