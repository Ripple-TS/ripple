import { track, type Derived } from 'ripple';
import WeatherUtils from '../../../shared/src/WeatherUtils.js';
import type { WeatherData } from '../types';

interface CurrentWeatherProps {
	weatherData: Derived<WeatherData | null>;
}

export function CurrentWeather({ weatherData }: CurrentWeatherProps) @{
	const current = track(() => weatherData.value!.current);
	const locationName = track(() => weatherData.value!.locationName);
	const country = track(() => weatherData.value!.country);
	const pressure = track(() => current.value.pressure_msl ?? current.value.surface_pressure);

	@if (weatherData.value !== null) {
		<section class="current-section">
			<h2 class="section-title">Current Weather</h2>
			<div class="weather-card" data-testid="current-weather">
				<div class="current-weather">
					<h3 class="current-weather__location" data-testid="current-location">
						{locationName.value as string}
						{(country.value ? ', ' + country.value : '') as string}
					</h3>
					<div class="current-weather__main">
						<div
							class="current-weather__icon"
							data-testid="current-icon"
						>{WeatherUtils.getWeatherIcon(
							current.value.weather_code,
							current.value.is_day,
						) as string}</div>
						<div class="current-weather__temp-group">
							<div
								class="current-weather__temp"
								data-testid="current-temperature"
							>{WeatherUtils.formatTemperature(current.value.temperature_2m) as string}</div>
							<div
								class={[
									'current-weather__condition',
									WeatherUtils.getConditionClass(current.value.weather_code),
								]}
								data-testid="current-condition"
							>{WeatherUtils.getWeatherDescription(current.value.weather_code) as string}</div>
						</div>
					</div>

					<div class="current-weather__details">
						<div class="weather-detail">
							<div class="weather-detail__label">Feels like</div>
							<div
								class="weather-detail__value"
								data-testid="feels-like"
							>{WeatherUtils.formatTemperature(current.value.apparent_temperature) as string}</div>
						</div>
						<div class="weather-detail">
							<div class="weather-detail__label">Humidity</div>
							<div
								class="weather-detail__value"
								data-testid="humidity"
							>{WeatherUtils.formatPercentage(current.value.relative_humidity_2m) as string}</div>
						</div>
						<div class="weather-detail">
							<div class="weather-detail__label">Wind Speed</div>
							<div
								class="weather-detail__value"
								data-testid="wind-speed"
							>{WeatherUtils.formatWindSpeed(current.value.wind_speed_10m) as string}</div>
						</div>
						<div class="weather-detail">
							<div class="weather-detail__label">Pressure</div>
							<div
								class="weather-detail__value"
								data-testid="pressure"
							>{WeatherUtils.formatPressure(pressure.value) as string}</div>
						</div>
						<div class="weather-detail">
							<div class="weather-detail__label">Cloud Cover</div>
							<div
								class="weather-detail__value"
								data-testid="cloud-cover"
							>{WeatherUtils.formatPercentage(current.value.cloud_cover) as string}</div>
						</div>
						<div class="weather-detail">
							<div class="weather-detail__label">Wind Direction</div>
							<div
								class="weather-detail__value"
								data-testid="wind-direction"
							>{WeatherUtils.getWindDirection(current.value.wind_direction_10m) as string}</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	}
}
