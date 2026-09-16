import CurrentWeather from './CurrentWeather.jsx';
import Forecast from './Forecast.jsx';

function WeatherContent(props) {
	return (
		<div class="weather-content" data-testid="weather-content" hidden={!props.isVisible}>
			<div class="weather-layout">
				<CurrentWeather weatherData={props.weatherData} />
				<Forecast weatherData={props.weatherData} />
			</div>
		</div>
	);
}

export default WeatherContent;
