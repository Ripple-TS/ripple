import { track, effect } from 'ripple';
import WeatherService from '../../../shared/src/WeatherService.js';
import type { WeatherData } from '../types';

const messageFor = (error: unknown) => (error instanceof Error ? error.message : String(error));
const isAbortError = (error: unknown) =>
	error instanceof DOMException && error.name === 'AbortError';

export function useWeatherData() {
	const weatherData = track<WeatherData | null>(null);
	const isLoading = track(false);
	const error = track<string | null>(null);
	const weatherService = new WeatherService();
	let activeRequest: AbortController | null = null;

	const replaceRequest = () => {
		activeRequest?.abort();
		const controller = new AbortController();
		activeRequest = controller;
		return controller;
	};

	const loadWeather = async (city: string) => {
		const controller = replaceRequest();
		try {
			isLoading.value = true;
			error.value = null;

			const data = await weatherService.getWeatherByCity(city, controller.signal) as WeatherData;
			if (controller.signal.aborted || activeRequest !== controller) return null;

			weatherData.value = data;
			try {
				localStorage.setItem('weather-app-location', city);
			} catch (storageError) {
				console.warn('Could not save location to localStorage:', storageError);
			}
			return data;
		} catch (requestError) {
			if (controller.signal.aborted || activeRequest !== controller) return null;
			error.value = messageFor(requestError);
			return null;
		} finally {
			if (activeRequest === controller) {
				activeRequest = null;
				isLoading.value = false;
			}
		}
	};

	const getCurrentLocationWeather = () => {
		const controller = replaceRequest();
		return new Promise<WeatherData>((resolve, reject) => {
			if (!navigator.geolocation) {
				reject(new Error('Geolocation not supported'));
				return;
			}

			controller.signal.addEventListener('abort', () => reject(controller.signal.reason), {
				once: true,
			});
			isLoading.value = true;
			error.value = null;
			navigator.geolocation.getCurrentPosition(async (position) => {
				try {
					if (controller.signal.aborted) return;
					const { latitude, longitude } = position.coords;
					const data = await weatherService.getWeatherData(
						latitude,
						longitude,
						controller.signal,
					) as WeatherData;
					if (controller.signal.aborted || activeRequest !== controller) return;
					data.locationName = 'Current Location';
					weatherData.value = data;
					resolve(data);
				} catch (requestError) {
					if (controller.signal.aborted || activeRequest !== controller) return;
					error.value = messageFor(requestError);
					reject(requestError);
				} finally {
					if (activeRequest === controller) {
						activeRequest = null;
						isLoading.value = false;
					}
				}
			}, (locationError) => {
				if (activeRequest === controller) {
					activeRequest = null;
					isLoading.value = false;
				}
				reject(locationError);
			}, {
				timeout: 10000,
				enableHighAccuracy: false,
				maximumAge: 300000,
			});
		});
	};

	const loadSavedLocation = async () => {
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
	};

	effect(() => {
		void loadSavedLocation().catch((loadError) => {
			console.error('Failed to auto-load weather:', loadError);
		});

		return () => {
			activeRequest?.abort();
			activeRequest = null;
		};
	});

	return {
		weatherData,
		isLoading,
		error,
		loadWeather,
		loadSavedLocation,
		getCurrentLocationWeather,
	};
}
