import { memo, useCallback, useMemo } from 'octane';
import WeatherUtils from '../../../shared/src/WeatherUtils.js';
import type { DailyWeatherData } from '../types';

interface ForecastItemProps {
	daily: DailyWeatherData;
	index: number;
	isActive: boolean;
	onToggle: (index: number) => void;
}

function ForecastItemImpl({ daily, index, isActive, onToggle }: ForecastItemProps) @{
	const forecastData = useMemo(
		() => ({
			dayName: WeatherUtils.formatDate(daily.time[index]),
			weatherCode: daily.weather_code[index],
			high: daily.temperature_2m_max[index],
			low: daily.temperature_2m_min[index],
		}),
	);

	const condition = useMemo(() => WeatherUtils.getWeatherDescription(forecastData.weatherCode));
	const icon = useMemo(() => WeatherUtils.getWeatherIcon(forecastData.weatherCode));

	const handleClick = useCallback(() => {
		onToggle(index);
	});

	const handleKeyDown = useCallback((event: KeyboardEvent) => {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			onToggle(index);
		}
	});

	<div
		class={['forecast-item', { active: isActive }]}
		data-testid="forecast-item"
		tabIndex={0}
		role="button"
		aria-label={'View detailed forecast for ' + forecastData.dayName}
		onClick={handleClick}
		onKeyDown={handleKeyDown}
	>
		<div class="forecast-item__day">{forecastData.dayName as string}</div>
		<div class="forecast-item__icon">{icon as string}</div>
		<div class="forecast-item__info">
			<div class="forecast-item__condition">{condition as string}</div>
			<div class="forecast-item__temps" data-testid="forecast-temps">
				<span
					class="forecast-item__high"
					data-testid="forecast-high"
				>{WeatherUtils.formatTemperature(forecastData.high) as string}</span>
				<span class="forecast-item__low" data-testid="forecast-low">{WeatherUtils.formatTemperature(
					forecastData.low,
				) as string}</span>
			</div>
		</div>

		@if (isActive) {
			<div class="forecast-item__details">
				<div class="forecast-detail-item">
					<div class="forecast-detail-item__label">Sunrise</div>
					<div class="forecast-detail-item__value">{WeatherUtils.formatTime(
						daily.sunrise[index],
					) as string}</div>
				</div>
				<div class="forecast-detail-item">
					<div class="forecast-detail-item__label">Sunset</div>
					<div class="forecast-detail-item__value">{WeatherUtils.formatTime(
						daily.sunset[index],
					) as string}</div>
				</div>
				<div class="forecast-detail-item">
					<div class="forecast-detail-item__label">Rain</div>
					<div class="forecast-detail-item__value">{daily.rain_sum[index].toFixed(1) + ' mm'}</div>
				</div>
				<div class="forecast-detail-item">
					<div class="forecast-detail-item__label">UV Index</div>
					<div class="forecast-detail-item__value">{daily.uv_index_max[index].toFixed(
						1,
					) as string}</div>
				</div>
				<div class="forecast-detail-item">
					<div class="forecast-detail-item__label">Precipitation</div>
					<div class="forecast-detail-item__value">{WeatherUtils.formatPercentage(
						daily.precipitation_probability_max[index],
					) as string}</div>
				</div>
				<div class="forecast-detail-item">
					<div class="forecast-detail-item__label">Temperature</div>
					<div class="forecast-detail-item__value">
						{WeatherUtils.formatTemperature(daily.temperature_2m_min[index]) as string}
						{' to '}
						{WeatherUtils.formatTemperature(daily.temperature_2m_max[index]) as string}
					</div>
				</div>
			</div>
		}
	</div>
}

export const ForecastItem = memo(ForecastItemImpl);
