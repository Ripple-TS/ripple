const abortError = (signal) =>
	signal.reason instanceof Error
		? signal.reason
		: new DOMException('The weather request was aborted.', 'AbortError');

const isAbortError = (error) => error instanceof DOMException && error.name === 'AbortError';

const wait = (duration, signal) =>
	new Promise((resolve, reject) => {
		if (signal?.aborted) {
			reject(abortError(signal));
			return;
		}

		const timer = setTimeout(resolve, duration);
		signal?.addEventListener(
			'abort',
			() => {
				clearTimeout(timer);
				reject(abortError(signal));
			},
			{ once: true },
		);
	});

class WeatherService {
	constructor() {
		this.baseUrl = 'https://api.open-meteo.com/v1';
		this.geocodingUrl = 'https://geocoding-api.open-meteo.com/v1';
		this.useMockData = this.shouldUseMockData();
	}

	shouldUseMockData() {
		const isTestEnvironment =
			navigator.userAgent.includes('Playwright') ||
			navigator.userAgent.includes('HeadlessChrome') ||
			window.location.search.includes('mock=true');

		if (window.location.search.includes('mock=false')) {
			return false;
		}

		return window.location.search.includes('mock=true') || isTestEnvironment;
	}

	async getMockData(signal) {
		try {
			if (this.isTestEnvironment() && !window.location.search.includes('benchmark=true')) {
				await wait(200, signal);
			}

			const response = await fetch('/mocks/weather-data.json', { signal });
			if (!response.ok) {
				throw new Error('Failed to load mock data');
			}
			return await response.json();
		} catch (error) {
			if (isAbortError(error)) throw error;
			console.error('Error loading mock data:', error);
			throw error;
		}
	}

	isTestEnvironment() {
		return (
			navigator.userAgent.includes('Playwright') || navigator.userAgent.includes('HeadlessChrome')
		);
	}

	getMockGeocodingData(cityName, signal) {
		if (signal?.aborted) throw abortError(signal);

		const mockCities = {
			London: {
				latitude: 51.5074,
				longitude: -0.1278,
				name: 'London',
				country: 'United Kingdom',
			},
			Tokyo: {
				latitude: 35.6762,
				longitude: 139.6503,
				name: 'Tokyo',
				country: 'Japan',
			},
			Paris: {
				latitude: 48.8566,
				longitude: 2.3522,
				name: 'Paris',
				country: 'France',
			},
			'São Paulo': {
				latitude: -23.5505,
				longitude: -46.6333,
				name: 'São Paulo',
				country: 'Brazil',
			},
			'New York': {
				latitude: 40.7128,
				longitude: -74.006,
				name: 'New York',
				country: 'United States',
			},
		};

		if (cityName.includes('Invalid') || cityName.includes('123') || !cityName.trim()) {
			throw new Error('Unable to find location. Please check the city name and try again.');
		}

		return mockCities[cityName] || mockCities.London;
	}

	async geocodeLocation(cityName, signal) {
		if (this.useMockData) {
			return this.getMockGeocodingData(cityName, signal);
		}

		try {
			const response = await fetch(
				`${this.geocodingUrl}/search?name=${encodeURIComponent(cityName)}&count=1&language=en&format=json`,
				{ signal },
			);

			if (!response.ok) {
				throw new Error('Geocoding failed');
			}

			const data = await response.json();
			if (!data.results || data.results.length === 0) {
				throw new Error('Location not found');
			}

			const location = data.results[0];
			return {
				latitude: location.latitude,
				longitude: location.longitude,
				name: location.name,
				country: location.country,
			};
		} catch (error) {
			if (isAbortError(error)) throw error;
			console.error('Geocoding error:', error);
			throw new Error('Unable to find location. Please check the city name and try again.');
		}
	}

	async getWeatherData(latitude, longitude, signal) {
		if (this.useMockData) {
			return await this.getMockData(signal);
		}

		try {
			const params = new URLSearchParams({
				latitude: latitude.toString(),
				longitude: longitude.toString(),
				daily:
					'temperature_2m_max,temperature_2m_min,weather_code,sunrise,sunset,rain_sum,uv_index_max,precipitation_probability_max',
				current:
					'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,snowfall,showers,rain,precipitation,weather_code,cloud_cover,pressure_msl,surface_pressure,wind_direction_10m,wind_gusts_10m,wind_speed_10m',
				timezone: 'GMT',
			});

			const response = await fetch(`${this.baseUrl}/forecast?${params}`, { signal });
			if (!response.ok) {
				throw new Error(`Weather API error: ${response.status}`);
			}

			return await response.json();
		} catch (error) {
			if (isAbortError(error)) throw error;
			console.error('Weather API error:', error);
			throw new Error('Unable to fetch weather data. Please try again later.');
		}
	}

	async getWeatherByCity(cityName, signal) {
		try {
			const location = await this.geocodeLocation(cityName, signal);
			const weather = await this.getWeatherData(location.latitude, location.longitude, signal);

			return {
				...weather,
				locationName: location.name,
				country: location.country,
			};
		} catch (error) {
			if (isAbortError(error)) throw error;
			console.error('Weather service error:', error);
			throw error;
		}
	}
}

export default WeatherService;
