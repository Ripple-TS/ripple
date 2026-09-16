import { useCallback, useEffect, useRef, useState } from 'react';
import WeatherService from '../../../shared/src/WeatherService.js';

const messageFor = (error) => (error instanceof Error ? error.message : String(error));
const isAbortError = (error) => error instanceof DOMException && error.name === 'AbortError';

const useWeatherData = () => {
	const [weatherData, setWeatherData] = useState(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState(null);
	const [weatherService] = useState(() => new WeatherService());
	const activeRequest = useRef(null);

	const replaceRequest = useCallback(() => {
		activeRequest.current?.abort();
		const controller = new AbortController();
		activeRequest.current = controller;
		return controller;
	}, []);

	const loadWeather = useCallback(
		async (city) => {
			const controller = replaceRequest();
			try {
				setIsLoading(true);
				setError(null);

				const data = await weatherService.getWeatherByCity(city, controller.signal);
				if (controller.signal.aborted || activeRequest.current !== controller) return null;

				setWeatherData(data);
				try {
					localStorage.setItem('weather-app-location', city);
				} catch (storageError) {
					console.warn('Could not save location to localStorage:', storageError);
				}
				return data;
			} catch (requestError) {
				if (controller.signal.aborted || activeRequest.current !== controller) return null;
				setError(messageFor(requestError));
				return null;
			} finally {
				if (activeRequest.current === controller) {
					activeRequest.current = null;
					setIsLoading(false);
				}
			}
		},
		[replaceRequest, weatherService],
	);

	const getCurrentLocationWeather = useCallback(() => {
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
						if (controller.signal.aborted || activeRequest.current !== controller) return;
						data.locationName = 'Current Location';
						setWeatherData(data);
						resolve(data);
					} catch (requestError) {
						if (controller.signal.aborted || activeRequest.current !== controller) return;
						setError(messageFor(requestError));
						reject(requestError);
					} finally {
						if (activeRequest.current === controller) {
							activeRequest.current = null;
							setIsLoading(false);
						}
					}
				},
				(locationError) => {
					if (activeRequest.current === controller) {
						activeRequest.current = null;
						setIsLoading(false);
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
	}, [replaceRequest, weatherService]);

	const loadSavedLocation = useCallback(async () => {
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
	}, [getCurrentLocationWeather, loadWeather, weatherService]);

	useEffect(() => {
		void loadSavedLocation().catch((loadError) => {
			console.error('Failed to auto-load weather:', loadError);
		});

		return () => {
			activeRequest.current?.abort();
			activeRequest.current = null;
		};
	}, [loadSavedLocation]);

	return {
		weatherData,
		isLoading,
		error,
		loadWeather,
		loadSavedLocation,
		getCurrentLocationWeather,
	};
};

export default useWeatherData;
