import { createSignal, flush } from 'solid-js';
import WeatherService from '../../../shared/src/WeatherService.js';

const [weatherData, setWeatherData] = createSignal(null);
const [isLoading, setIsLoading] = createSignal(false);
const [error, setError] = createSignal(null);
const weatherService = new WeatherService();

let activeRequest = null;

const messageFor = (value) => (value instanceof Error ? value.message : String(value));
const isAbortError = (value) => value instanceof DOMException && value.name === 'AbortError';

function replaceRequest() {
	activeRequest?.abort();
	const controller = new AbortController();
	activeRequest = controller;
	return controller;
}

function saveLocation(city) {
	try {
		localStorage.setItem('weather-app-location', city);
	} catch (storageError) {
		console.warn('Could not save location to localStorage:', storageError);
	}
}

function getSavedLocation() {
	try {
		return localStorage.getItem('weather-app-location');
	} catch (storageError) {
		console.warn('Could not load saved location:', storageError);
		return null;
	}
}

export const weatherStore = {
	weatherData,
	isLoading,
	error,

	async loadWeather(city) {
		const controller = replaceRequest();
		try {
			setIsLoading(true);
			setError(null);
			flush();

			const data = await weatherService.getWeatherByCity(city, controller.signal);
			if (controller.signal.aborted || activeRequest !== controller) return null;

			setWeatherData(data);
			saveLocation(city);
			return data;
		} catch (requestError) {
			if (controller.signal.aborted || activeRequest !== controller) return null;
			setError(messageFor(requestError));
			return null;
		} finally {
			if (activeRequest === controller) {
				activeRequest = null;
				setIsLoading(false);
				flush();
			}
		}
	},

	getCurrentLocationWeather() {
		const controller = replaceRequest();
		return new Promise((resolve, reject) => {
			if (!navigator.geolocation) {
				reject(new Error('Geolocation not supported'));
				return;
			}

			controller.signal.addEventListener('abort', () => reject(controller.signal.reason), {
				once: true,
			});
			setIsLoading(true);
			setError(null);
			flush();
			navigator.geolocation.getCurrentPosition(
				async (position) => {
					try {
						if (controller.signal.aborted) return;
						const { latitude, longitude } = position.coords;
						const data = await weatherService.getWeatherData(
							latitude,
							longitude,
							controller.signal,
						);
						if (controller.signal.aborted || activeRequest !== controller) return;
						data.locationName = 'Current Location';
						setWeatherData(data);
						resolve(data);
					} catch (requestError) {
						if (controller.signal.aborted || activeRequest !== controller) return;
						setError(messageFor(requestError));
						reject(requestError);
					} finally {
						if (activeRequest === controller) {
							activeRequest = null;
							setIsLoading(false);
							flush();
						}
					}
				},
				(locationError) => {
					if (activeRequest === controller) {
						activeRequest = null;
						setIsLoading(false);
						flush();
					}
					reject(locationError);
				},
				{
					timeout: 10_000,
					enableHighAccuracy: false,
					maximumAge: 300_000,
				},
			);
		});
	},

	async initialize() {
		const savedLocation = getSavedLocation();
		if (savedLocation) {
			await this.loadWeather(savedLocation);
			return savedLocation;
		}

		if (weatherService.useMockData) {
			await this.loadWeather('London');
			return 'London';
		}

		try {
			await this.getCurrentLocationWeather();
			return 'Current Location';
		} catch (locationError) {
			if (isAbortError(locationError)) return null;
			console.warn('Could not get current location:', locationError);
			await this.loadWeather('London');
			return 'London';
		}
	},

	cancel() {
		activeRequest?.abort();
		activeRequest = null;
	},
};
