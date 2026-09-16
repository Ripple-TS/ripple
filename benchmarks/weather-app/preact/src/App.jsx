import SearchForm from './components/SearchForm';
import LoadingState from './components/LoadingState';
import ErrorState from './components/ErrorState';
import WeatherContent from './components/WeatherContent';
import useWeatherData from './hooks/useWeatherData';

function App() {
	const { weatherData, isLoading, error, loadWeather } = useWeatherData();

	const handleSearch = async (city) => {
		await loadWeather(city);
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
					<SearchForm onSearch={handleSearch} isLoading={isLoading} />

					<div class="weather-container" data-testid="weather-container">
						<LoadingState isVisible={isLoading} />
						<ErrorState isVisible={!!error && !isLoading} message={error} />
						<WeatherContent
							isVisible={!!weatherData && !isLoading && !error}
							weatherData={weatherData}
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
