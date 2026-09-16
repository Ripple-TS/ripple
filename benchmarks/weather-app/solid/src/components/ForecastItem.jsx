import { Show } from 'solid-js';
import WeatherUtils from '../../../shared/src/WeatherUtils.js';

function ForecastItem(props) {
	const dayName = () => WeatherUtils.formatDate(props.daily.time[props.index]);
	const weatherCode = () => props.daily.weather_code[props.index];
	const high = () => props.daily.temperature_2m_max[props.index];
	const low = () => props.daily.temperature_2m_min[props.index];

	const handleKeyDown = (event) => {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			props.onToggle(props.index);
		}
	};

	return (
		<div
			class={`forecast-item ${props.isActive ? 'active' : ''}`}
			data-testid="forecast-item"
			tabindex="0"
			role="button"
			aria-label={`View detailed forecast for ${dayName()}`}
			onClick={() => props.onToggle(props.index)}
			onKeyDown={handleKeyDown}
		>
			<div class="forecast-item__day">{dayName()}</div>
			<div class="forecast-item__icon">{WeatherUtils.getWeatherIcon(weatherCode())}</div>
			<div class="forecast-item__info">
				<div class="forecast-item__condition">
					{WeatherUtils.getWeatherDescription(weatherCode())}
				</div>
				<div class="forecast-item__temps" data-testid="forecast-temps">
					<span class="forecast-item__high" data-testid="forecast-high">
						{WeatherUtils.formatTemperature(high())}
					</span>
					<span class="forecast-item__low" data-testid="forecast-low">
						{WeatherUtils.formatTemperature(low())}
					</span>
				</div>
			</div>

			<Show when={props.isActive}>
				<div class="forecast-item__details">
					<div class="forecast-detail-item">
						<div class="forecast-detail-item__label">Sunrise</div>
						<div class="forecast-detail-item__value">
							{WeatherUtils.formatTime(props.daily.sunrise[props.index])}
						</div>
					</div>
					<div class="forecast-detail-item">
						<div class="forecast-detail-item__label">Sunset</div>
						<div class="forecast-detail-item__value">
							{WeatherUtils.formatTime(props.daily.sunset[props.index])}
						</div>
					</div>
					<div class="forecast-detail-item">
						<div class="forecast-detail-item__label">Rain</div>
						<div class="forecast-detail-item__value">
							{props.daily.rain_sum[props.index].toFixed(1)} mm
						</div>
					</div>
					<div class="forecast-detail-item">
						<div class="forecast-detail-item__label">UV Index</div>
						<div class="forecast-detail-item__value">
							{props.daily.uv_index_max[props.index].toFixed(1)}
						</div>
					</div>
					<div class="forecast-detail-item">
						<div class="forecast-detail-item__label">Precipitation</div>
						<div class="forecast-detail-item__value">
							{WeatherUtils.formatPercentage(
								props.daily.precipitation_probability_max[props.index],
							)}
						</div>
					</div>
					<div class="forecast-detail-item">
						<div class="forecast-detail-item__label">Temperature</div>
						<div class="forecast-detail-item__value">
							{WeatherUtils.formatTemperature(low())} to {WeatherUtils.formatTemperature(high())}
						</div>
					</div>
				</div>
			</Show>
		</div>
	);
}

export default ForecastItem;
