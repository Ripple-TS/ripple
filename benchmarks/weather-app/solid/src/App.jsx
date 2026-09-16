import { createEffect, onCleanup } from 'solid-js';
import ErrorState from './components/ErrorState.jsx';
import LoadingState from './components/LoadingState.jsx';
import SearchForm from './components/SearchForm.jsx';
import WeatherContent from './components/WeatherContent.jsx';
import { weatherStore } from './stores/weatherStore.js';

function App() {
	createEffect(
		() => {},
		() => {
			void weatherStore.initialize().catch((error) => {
				console.error('Failed to auto-load weather:', error);
			});
		},
	);
	onCleanup(() => weatherStore.cancel());

	const handleSearch = async (city) => {
		await weatherStore.loadWeather(city);
	};

	return (
		<>
			<header class="header">
				<div class="container">
					<h1 class="header__title">Weather Front</h1>
				</div>
			</header>

			<main class="main">
				<div class="container">
					<SearchForm onSearch={handleSearch} isLoading={weatherStore.isLoading()} />

					<div class="weather-container" data-testid="weather-container">
						<LoadingState isVisible={weatherStore.isLoading()} />
						<ErrorState
							isVisible={weatherStore.error() !== null && !weatherStore.isLoading()}
							message={weatherStore.error()}
						/>
						<WeatherContent
							isVisible={
								weatherStore.weatherData() !== null &&
								!weatherStore.isLoading() &&
								weatherStore.error() === null
							}
							weatherData={weatherStore.weatherData()}
						/>
					</div>
				</div>
			</main>

			<footer class="footer">
				<div class="container">
					<p class="footer__text">
						Weather Front benchmark • Weather data by{' '}
						<a href="https://open-meteo.com/" class="footer__link" target="_blank" rel="noreferrer">
							Open-Meteo
						</a>{' '}
						• Ported from{' '}
						<a
							href="https://github.com/Lissy93"
							class="footer__link"
							target="_blank"
							rel="noreferrer"
						>
							Alicia Sykes
						</a>
					</p>
				</div>
			</footer>
		</>
	);
}

export default App;
