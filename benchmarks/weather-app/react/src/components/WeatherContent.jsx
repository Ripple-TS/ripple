import React from 'react';
import CurrentWeather from './CurrentWeather';
import Forecast from './Forecast';

const WeatherContent = ({ isVisible, weatherData }) => {
	return (
		<div className="weather-content" data-testid="weather-content" hidden={!isVisible}>
			<div className="weather-layout">
				<CurrentWeather weatherData={weatherData} />
				<Forecast weatherData={weatherData} />
			</div>
		</div>
	);
};

export default React.memo(WeatherContent);
