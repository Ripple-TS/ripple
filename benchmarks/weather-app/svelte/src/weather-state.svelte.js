import WeatherService from '../../shared/src/WeatherService.js';

const messageFor = (error) => (error instanceof Error ? error.message : String(error));
const isAbortError = (error) => error instanceof DOMException && error.name === 'AbortError';

export function createWeatherState() {
	const weatherService = new WeatherService();
	const state = $state({
		weatherData: null,
		isLoading: false,
		error: null,
	});
	let activeRequest = null;

	function replaceRequest() {
		activeRequest?.abort();
		const controller = new AbortController();
		activeRequest = controller;
		return controller;
	}

	async function loadWeather(city) {
		const controller = replaceRequest();

		try {
			state.isLoading = true;
			state.error = null;

			const data = await weatherService.getWeatherByCity(city, controller.signal);
			if (controller.signal.aborted || activeRequest !== controller) return null;

			state.weatherData = data;
			try {
				localStorage.setItem('weather-app-location', city);
			} catch (storageError) {
				console.warn('Could not save location to localStorage:', storageError);
			}
			return data;
		} catch (requestError) {
			if (controller.signal.aborted || activeRequest !== controller) return null;
			state.error = messageFor(requestError);
			return null;
		} finally {
			if (activeRequest === controller) {
				activeRequest = null;
				state.isLoading = false;
			}
		}
	}

	function getCurrentLocationWeather() {
		const controller = replaceRequest();

		return new Promise((resolve, reject) => {
			if (!navigator.geolocation) {
				reject(new Error('Geolocation not supported'));
				return;
			}

			controller.signal.addEventListener('abort', () => reject(controller.signal.reason), {
				once: true,
			});
			state.isLoading = true;
			state.error = null;

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
						state.weatherData = data;
						resolve(data);
					} catch (requestError) {
						if (controller.signal.aborted || activeRequest !== controller) return;
						state.error = messageFor(requestError);
						reject(requestError);
					} finally {
						if (activeRequest === controller) {
							activeRequest = null;
							state.isLoading = false;
						}
					}
				},
				(locationError) => {
					if (activeRequest === controller) {
						activeRequest = null;
						state.isLoading = false;
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
	}

	async function initialize() {
		try {
			const savedLocation = localStorage.getItem('weather-app-location');
			if (savedLocation) {
				await loadWeather(savedLocation);
				return savedLocation;
			}
		} catch (storageError) {
			console.warn('Could not load saved location:', storageError);
		}

		if (weatherService.useMockData) {
			await loadWeather('London');
			return 'London';
		}

		try {
			await getCurrentLocationWeather();
			return 'Current Location';
		} catch (locationError) {
			if (isAbortError(locationError)) return null;
			console.warn('Could not get current location:', locationError);
			await loadWeather('London');
			return 'London';
		}
	}

	function destroy() {
		activeRequest?.abort();
		activeRequest = null;
	}

	return { state, loadWeather, initialize, destroy };
}
