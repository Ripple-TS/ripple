<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue';
import WeatherService from '../../shared/src/WeatherService.js';
import ErrorState from './components/ErrorState.vue';
import LoadingState from './components/LoadingState.vue';
import SearchForm from './components/SearchForm.vue';
import WeatherContent from './components/WeatherContent.vue';

const weatherData = ref(null);
const isLoading = ref(false);
const error = ref(null);
const searchValue = ref('London');
const weatherService = new WeatherService();
let activeRequest = null;

const loadWeather = async (city) => {
	activeRequest?.abort();
	const controller = new AbortController();
	activeRequest = controller;
	isLoading.value = true;
	error.value = null;

	try {
		const data = await weatherService.getWeatherByCity(city, controller.signal);
		if (controller.signal.aborted || activeRequest !== controller) return null;

		weatherData.value = data;
		searchValue.value = city;
		try {
			localStorage.setItem('weather-app-location', city);
		} catch (storageError) {
			console.warn('Could not save location to localStorage:', storageError);
		}
		return data;
	} catch (requestError) {
		if (controller.signal.aborted || activeRequest !== controller) return null;
		error.value = requestError instanceof Error ? requestError.message : String(requestError);
		return null;
	} finally {
		if (activeRequest === controller) {
			activeRequest = null;
			isLoading.value = false;
		}
	}
};

onMounted(() => {
	let initialCity = 'London';
	try {
		initialCity = localStorage.getItem('weather-app-location') || initialCity;
	} catch (storageError) {
		console.warn('Could not load saved location:', storageError);
	}
	searchValue.value = initialCity;
	void loadWeather(initialCity);
});

onBeforeUnmount(() => {
	activeRequest?.abort();
	activeRequest = null;
});
</script>

<template>
	<header class="header">
		<div class="container">
			<h1 class="header__title">Weather Front</h1>
		</div>
	</header>

	<main class="main">
		<div class="container">
			<SearchForm :is-loading="isLoading" :current-value="searchValue" @search="loadWeather" />

			<div class="weather-container" data-testid="weather-container">
				<LoadingState :is-visible="isLoading" />
				<ErrorState :is-visible="Boolean(error) && !isLoading" :message="error" />
				<WeatherContent
					:is-visible="Boolean(weatherData) && !isLoading && !error"
					:weather-data="weatherData"
				/>
			</div>
		</div>
	</main>

	<footer class="footer">
		<div class="container">
			<p class="footer__text">
				Weather Front benchmark • Weather data by
				<a href="https://open-meteo.com/" class="footer__link" target="_blank" rel="noreferrer">
					Open-Meteo
				</a>
				• Ported from
				<a href="https://github.com/Lissy93" class="footer__link" target="_blank" rel="noreferrer">
					Alicia Sykes
				</a>
			</p>
		</div>
	</footer>
</template>
