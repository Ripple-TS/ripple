import React from 'react';
import WeatherUtils from '../../../shared/src/WeatherUtils.js';

const CurrentWeather = ({ weatherData }) => {
	if (!weatherData) {
		return null;
	}

	const { current, locationName, country } = weatherData;

	return (
		<section className="current-section">
			<h2 className="section-title">Current Weather</h2>
			<div className="weather-card" data-testid="current-weather">
				<div className="current-weather">
					<h3 className="current-weather__location" data-testid="current-location">
						{locationName}
						{country ? `, ${country}` : ''}
					</h3>
					<div className="current-weather__main">
						<div className="current-weather__icon" data-testid="current-icon">
							{WeatherUtils.getWeatherIcon(current.weather_code, current.is_day)}
						</div>
						<div className="current-weather__temp-group">
							<div className="current-weather__temp" data-testid="current-temperature">
								{WeatherUtils.formatTemperature(current.temperature_2m)}
							</div>
							<div
								className={`current-weather__condition ${WeatherUtils.getConditionClass(current.weather_code)}`}
								data-testid="current-condition"
							>
								{WeatherUtils.getWeatherDescription(current.weather_code)}
							</div>
						</div>
					</div>

					<div className="current-weather__details">
						<div className="weather-detail">
							<div className="weather-detail__label">Feels like</div>
							<div className="weather-detail__value" data-testid="feels-like">
								{WeatherUtils.formatTemperature(current.apparent_temperature)}
							</div>
						</div>
						<div className="weather-detail">
							<div className="weather-detail__label">Humidity</div>
							<div className="weather-detail__value" data-testid="humidity">
								{WeatherUtils.formatPercentage(current.relative_humidity_2m)}
							</div>
						</div>
						<div className="weather-detail">
							<div className="weather-detail__label">Wind Speed</div>
							<div className="weather-detail__value" data-testid="wind-speed">
								{WeatherUtils.formatWindSpeed(current.wind_speed_10m)}
							</div>
						</div>
						<div className="weather-detail">
							<div className="weather-detail__label">Pressure</div>
							<div className="weather-detail__value" data-testid="pressure">
								{WeatherUtils.formatPressure(current.pressure_msl ?? current.surface_pressure)}
							</div>
						</div>
						<div className="weather-detail">
							<div className="weather-detail__label">Cloud Cover</div>
							<div className="weather-detail__value" data-testid="cloud-cover">
								{WeatherUtils.formatPercentage(current.cloud_cover)}
							</div>
						</div>
						<div className="weather-detail">
							<div className="weather-detail__label">Wind Direction</div>
							<div className="weather-detail__value" data-testid="wind-direction">
								{WeatherUtils.getWindDirection(current.wind_direction_10m)}
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
};

export default React.memo(CurrentWeather);
