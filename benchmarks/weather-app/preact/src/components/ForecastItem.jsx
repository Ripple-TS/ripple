import WeatherUtils from '../../../shared/src/WeatherUtils.js';

const ForecastItem = ({ daily, index, isActive = false, onToggle }) => {
	const dayName = WeatherUtils.formatDate(daily.time[index]);
	const weatherCode = daily.weather_code[index];
	const high = daily.temperature_2m_max[index];
	const low = daily.temperature_2m_min[index];
	const condition = WeatherUtils.getWeatherDescription(weatherCode);
	const icon = WeatherUtils.getWeatherIcon(weatherCode);

	const handleClick = () => {
		onToggle?.(index);
	};

	const handleKeyDown = (event) => {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			onToggle?.(index);
		}
	};

	return (
		<div
			class={`forecast-item ${isActive ? 'active' : ''}`}
			data-testid="forecast-item"
			tabIndex="0"
			role="button"
			aria-label={`View detailed forecast for ${dayName}`}
			onClick={handleClick}
			onKeyDown={handleKeyDown}
		>
			<div class="forecast-item__day">{dayName}</div>
			<div class="forecast-item__icon">{icon}</div>
			<div class="forecast-item__info">
				<div class="forecast-item__condition">{condition}</div>
				<div class="forecast-item__temps" data-testid="forecast-temps">
					<span class="forecast-item__high" data-testid="forecast-high">
						{WeatherUtils.formatTemperature(high)}
					</span>
					<span class="forecast-item__low" data-testid="forecast-low">
						{WeatherUtils.formatTemperature(low)}
					</span>
				</div>
			</div>

			{isActive && (
				<div class="forecast-item__details">
					<div class="forecast-detail-item">
						<div class="forecast-detail-item__label">Sunrise</div>
						<div class="forecast-detail-item__value">
							{WeatherUtils.formatTime(daily.sunrise[index])}
						</div>
					</div>
					<div class="forecast-detail-item">
						<div class="forecast-detail-item__label">Sunset</div>
						<div class="forecast-detail-item__value">
							{WeatherUtils.formatTime(daily.sunset[index])}
						</div>
					</div>
					<div class="forecast-detail-item">
						<div class="forecast-detail-item__label">Rain</div>
						<div class="forecast-detail-item__value">{daily.rain_sum[index].toFixed(1)} mm</div>
					</div>
					<div class="forecast-detail-item">
						<div class="forecast-detail-item__label">UV Index</div>
						<div class="forecast-detail-item__value">{daily.uv_index_max[index].toFixed(1)}</div>
					</div>
					<div class="forecast-detail-item">
						<div class="forecast-detail-item__label">Precipitation</div>
						<div class="forecast-detail-item__value">
							{WeatherUtils.formatPercentage(daily.precipitation_probability_max[index])}
						</div>
					</div>
					<div class="forecast-detail-item">
						<div class="forecast-detail-item__label">Temperature</div>
						<div class="forecast-detail-item__value">
							{WeatherUtils.formatTemperature(low)} to {WeatherUtils.formatTemperature(high)}
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default ForecastItem;
