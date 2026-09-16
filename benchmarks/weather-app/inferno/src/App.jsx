import { Component } from 'inferno';
import WeatherService from '../../shared/src/WeatherService.js';
import SearchForm from './components/SearchForm.jsx';
import LoadingState from './components/LoadingState.jsx';
import ErrorState from './components/ErrorState.jsx';
import WeatherContent from './components/WeatherContent.jsx';

const messageFor = (error) => (error instanceof Error ? error.message : String(error));

export default class App extends Component {
	constructor(props) {
		super(props);
		this.state = { weatherData: null, isLoading: false, error: null };
		this.weatherService = new WeatherService();
		this.activeRequest = null;
	}

	componentDidMount() {
		let city = 'London';
		try {
			city = localStorage.getItem('weather-app-location') || city;
		} catch (storageError) {
			console.warn('Could not load saved location:', storageError);
		}
		void this.loadWeather(city);
	}

	componentWillUnmount() {
		this.activeRequest?.abort();
		this.activeRequest = null;
	}

	loadWeather = async (city) => {
		this.activeRequest?.abort();
		const controller = new AbortController();
		this.activeRequest = controller;
		this.setState({ isLoading: true, error: null });

		try {
			const weatherData = await this.weatherService.getWeatherByCity(city, controller.signal);
			if (controller.signal.aborted || this.activeRequest !== controller) return null;
			this.setState({ weatherData });
			try {
				localStorage.setItem('weather-app-location', city);
			} catch (storageError) {
				console.warn('Could not save location to localStorage:', storageError);
			}
			return weatherData;
		} catch (requestError) {
			if (controller.signal.aborted || this.activeRequest !== controller) return null;
			this.setState({ error: messageFor(requestError) });
			return null;
		} finally {
			if (this.activeRequest === controller) {
				this.activeRequest = null;
				this.setState({ isLoading: false });
			}
		}
	};

	render() {
		const { weatherData, isLoading, error } = this.state;
		return (
			<>
				<header class="header">
					<div class="container">
						<h1 class="header__title">Weather Front</h1>
					</div>
				</header>

				<main class="main">
					<div class="container">
						<SearchForm onSearch={this.loadWeather} isLoading={isLoading} />
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
							<a
								href="https://open-meteo.com/"
								class="footer__link"
								target="_blank"
								rel="noreferrer"
							>
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
}
