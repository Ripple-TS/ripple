import { ErrorBoundary } from 'octane';
import { ErrorState } from './components/ErrorState.tsrx';
import { LoadingState } from './components/LoadingState.tsrx';
import { SearchForm } from './components/SearchForm.tsrx';
import { WeatherContent } from './components/WeatherContent.tsrx';
import { useWeatherData } from './hooks/useWeatherData.tsrx';

function UnexpectedError({ error }: { error: unknown }) @{
	<div class="error" data-testid="error">
		<h2 class="error__title">Something went wrong</h2>
		<p class="error__message">
			An unexpected error occurred. Please refresh the page and try again.
		</p>
		<details style={{ marginTop: '1rem', fontSize: '0.875rem' }}>
			<summary>Error details</summary>
			<pre
				style={{
					marginTop: '0.5rem',
					padding: '0.5rem',
					background: '#f5f5f5',
					borderRadius: '4px',
				}}
			>{String(error) as string}</pre>
		</details>
	</div>
}

export function App() @{
	const { weatherData, isLoading, error, loadWeather } = useWeatherData();
	const handleSearch = async (city: string) => {
		await loadWeather(city);
	};

	<ErrorBoundary fallback={(caught: unknown) => <UnexpectedError error={caught} />}>
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
					<ErrorState isVisible={error !== null && !isLoading} message={error} />
					<WeatherContent
						isVisible={weatherData !== null && !isLoading && error === null}
						weatherData={weatherData}
					/>
				</div>
			</div>
		</main>

		<footer class="footer">
			<div class="container">
				<p class="footer__text">
					Weather Front benchmark • Weather data by
					{' '}
					<a href="https://open-meteo.com/" class="footer__link" target="_blank" rel="noreferrer">
						Open-Meteo
					</a>
					{' '}
					• Ported from
					{' '}
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
	</ErrorBoundary>
}
