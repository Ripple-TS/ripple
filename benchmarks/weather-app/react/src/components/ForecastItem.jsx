import React, { useCallback, useMemo } from 'react';
import WeatherUtils from '../../../shared/src/WeatherUtils.js';

const ForecastItem = ({ daily, index, isActive, onToggle }) => {
	const forecastData = useMemo(
		() => ({
			dayName: WeatherUtils.formatDate(daily.time[index]),
			weatherCode: daily.weather_code[index],
			high: daily.temperature_2m_max[index],
			low: daily.temperature_2m_min[index],
		}),
		[daily, index],
	);

	const condition = useMemo(
		() => WeatherUtils.getWeatherDescription(forecastData.weatherCode),
		[forecastData.weatherCode],
	);

	const icon = useMemo(
		() => WeatherUtils.getWeatherIcon(forecastData.weatherCode),
		[forecastData.weatherCode],
	);

	const handleClick = useCallback(() => {
		onToggle(index);
	}, [onToggle, index]);

	const handleKeyDown = useCallback(
		(e) => {
			if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault();
				onToggle(index);
			}
		},
		[onToggle, index],
	);

	return (
		<div
			className={`forecast-item ${isActive ? 'active' : ''}`}
			data-testid="forecast-item"
			tabIndex="0"
			role="button"
			aria-label={`View detailed forecast for ${forecastData.dayName}`}
			onClick={handleClick}
			onKeyDown={handleKeyDown}
		>
			<div className="forecast-item__day">{forecastData.dayName}</div>
			<div className="forecast-item__icon">{icon}</div>
			<div className="forecast-item__info">
				<div className="forecast-item__condition">{condition}</div>
				<div className="forecast-item__temps" data-testid="forecast-temps">
					<span className="forecast-item__high" data-testid="forecast-high">
						{WeatherUtils.formatTemperature(forecastData.high)}
					</span>
					<span className="forecast-item__low" data-testid="forecast-low">
						{WeatherUtils.formatTemperature(forecastData.low)}
					</span>
				</div>
			</div>

			{isActive && (
				<div className="forecast-item__details">
					<div className="forecast-detail-item">
						<div className="forecast-detail-item__label">Sunrise</div>
						<div className="forecast-detail-item__value">
							{WeatherUtils.formatTime(daily.sunrise[index])}
						</div>
					</div>
					<div className="forecast-detail-item">
						<div className="forecast-detail-item__label">Sunset</div>
						<div className="forecast-detail-item__value">
							{WeatherUtils.formatTime(daily.sunset[index])}
						</div>
					</div>
					<div className="forecast-detail-item">
						<div className="forecast-detail-item__label">Rain</div>
						<div className="forecast-detail-item__value">{daily.rain_sum[index].toFixed(1)} mm</div>
					</div>
					<div className="forecast-detail-item">
						<div className="forecast-detail-item__label">UV Index</div>
						<div className="forecast-detail-item__value">
							{daily.uv_index_max[index].toFixed(1)}
						</div>
					</div>
					<div className="forecast-detail-item">
						<div className="forecast-detail-item__label">Precipitation</div>
						<div className="forecast-detail-item__value">
							{WeatherUtils.formatPercentage(daily.precipitation_probability_max[index])}
						</div>
					</div>
					<div className="forecast-detail-item">
						<div className="forecast-detail-item__label">Temperature</div>
						<div className="forecast-detail-item__value">
							{WeatherUtils.formatTemperature(daily.temperature_2m_min[index])} to{' '}
							{WeatherUtils.formatTemperature(daily.temperature_2m_max[index])}
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default React.memo(ForecastItem);
