import React from 'react';
import ErrorBoundary from './components/ErrorBoundary';
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
		<ErrorBoundary>
			<header className="header">
				<div className="container">
					<h1 className="header__title">Weather Front</h1>
				</div>
			</header>

			<main className="main">
				<div className="container">
					<SearchForm onSearch={handleSearch} isLoading={isLoading} />

					<div className="weather-container" data-testid="weather-container">
						<LoadingState isVisible={isLoading} />
						<ErrorState isVisible={!!error && !isLoading} message={error} />
						<WeatherContent
							isVisible={!!weatherData && !isLoading && !error}
							weatherData={weatherData}
						/>
					</div>
				</div>
			</main>

			<footer className="footer">
				<div className="container">
					<p className="footer__text">
						Weather Front benchmark • Weather data by{' '}
						<a
							href="https://open-meteo.com/"
							className="footer__link"
							target="_blank"
							rel="noreferrer"
						>
							Open-Meteo
						</a>{' '}
						• Ported from{' '}
						<a
							href="https://github.com/Lissy93"
							className="footer__link"
							target="_blank"
							rel="noreferrer"
						>
							Alicia Sykes
						</a>
					</p>
				</div>
			</footer>
		</ErrorBoundary>
	);
}

export default App;
