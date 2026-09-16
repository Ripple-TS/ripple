import { track, type Derived } from 'ripple';
import WeatherUtils from '../../../shared/src/WeatherUtils.js';
import type { DailyWeatherData } from '../types';

interface ForecastItemProps {
	daily: Derived<DailyWeatherData>;
	index: number;
	isActive: Derived<boolean>;
	onToggle: (index: number) => void;
}

export function ForecastItem({ daily, index, isActive, onToggle }: ForecastItemProps) @{
	const forecastData = track(
		() => ({
			dayName: WeatherUtils.formatDate(daily.value.time[index]),
			weatherCode: daily.value.weather_code[index],
			high: daily.value.temperature_2m_max[index],
			low: daily.value.temperature_2m_min[index],
		}),
	);

	const condition = track(() => WeatherUtils.getWeatherDescription(forecastData.value.weatherCode));
	const icon = track(() => WeatherUtils.getWeatherIcon(forecastData.value.weatherCode));

	const handleClick = () => {
		onToggle(index);
	};

	const handleKeyDown = (event: KeyboardEvent) => {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			onToggle(index);
		}
	};

	<div
		class={['forecast-item', { active: isActive.value }]}
		data-testid="forecast-item"
		tabIndex={0}
		role="button"
		aria-label={'View detailed forecast for ' + forecastData.value.dayName}
		onClick={handleClick}
		onKeyDown={handleKeyDown}
	>
		<div class="forecast-item__day">{forecastData.value.dayName as string}</div>
		<div class="forecast-item__icon">{icon.value as string}</div>
		<div class="forecast-item__info">
			<div class="forecast-item__condition">{condition.value as string}</div>
			<div class="forecast-item__temps" data-testid="forecast-temps">
				<span
					class="forecast-item__high"
					data-testid="forecast-high"
				>{WeatherUtils.formatTemperature(forecastData.value.high) as string}</span>
				<span class="forecast-item__low" data-testid="forecast-low">{WeatherUtils.formatTemperature(
					forecastData.value.low,
				) as string}</span>
			</div>
		</div>

		@if (isActive.value) {
			<div class="forecast-item__details">
				<div class="forecast-detail-item">
					<div class="forecast-detail-item__label">Sunrise</div>
					<div class="forecast-detail-item__value">{WeatherUtils.formatTime(
						daily.value.sunrise[index],
					) as string}</div>
				</div>
				<div class="forecast-detail-item">
					<div class="forecast-detail-item__label">Sunset</div>
					<div class="forecast-detail-item__value">{WeatherUtils.formatTime(
						daily.value.sunset[index],
					) as string}</div>
				</div>
				<div class="forecast-detail-item">
					<div class="forecast-detail-item__label">Rain</div>
					<div class="forecast-detail-item__value">
						{daily.value.rain_sum[index].toFixed(1) + ' mm'}
					</div>
				</div>
				<div class="forecast-detail-item">
					<div class="forecast-detail-item__label">UV Index</div>
					<div class="forecast-detail-item__value">{daily.value.uv_index_max[index].toFixed(
						1,
					) as string}</div>
				</div>
				<div class="forecast-detail-item">
					<div class="forecast-detail-item__label">Precipitation</div>
					<div class="forecast-detail-item__value">{WeatherUtils.formatPercentage(
						daily.value.precipitation_probability_max[index],
					) as string}</div>
				</div>
				<div class="forecast-detail-item">
					<div class="forecast-detail-item__label">Temperature</div>
					<div class="forecast-detail-item__value">
						{WeatherUtils.formatTemperature(daily.value.temperature_2m_min[index]) as string}
						{' to '}
						{WeatherUtils.formatTemperature(daily.value.temperature_2m_max[index]) as string}
					</div>
				</div>
			</div>
		}
	</div>
}
