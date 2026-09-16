<script>
	import { onMount } from 'svelte';
	import ErrorState from './components/ErrorState.svelte';
	import LoadingState from './components/LoadingState.svelte';
	import SearchForm from './components/SearchForm.svelte';
	import WeatherContent from './components/WeatherContent.svelte';
	import { createWeatherState } from './weather-state.svelte.js';

	const weather = createWeatherState();
	const state = weather.state;

	onMount(() => {
		void weather.initialize().catch((loadError) => {
			console.error('Failed to auto-load weather:', loadError);
		});

		return weather.destroy;
	});
</script>

<header class="header">
	<div class="container">
		<h1 class="header__title">Weather Front</h1>
	</div>
</header>

<main class="main">
	<div class="container">
		<SearchForm onSearch={weather.loadWeather} isLoading={state.isLoading} />

		<div class="weather-container" data-testid="weather-container">
			<LoadingState isVisible={state.isLoading} />
			<ErrorState isVisible={state.error !== null && !state.isLoading} message={state.error} />
			<WeatherContent
				isVisible={state.weatherData !== null && !state.isLoading && state.error === null}
				weatherData={state.weatherData}
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
