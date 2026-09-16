import CurrentWeather from './CurrentWeather';
import Forecast from './Forecast';

const WeatherContent = ({ isVisible, weatherData }) => {
	return (
		<div class="weather-content" data-testid="weather-content" hidden={!isVisible}>
			<div class="weather-layout">
				<CurrentWeather weatherData={weatherData} />
				<Forecast weatherData={weatherData} />
			</div>
		</div>
	);
};

export default WeatherContent;
