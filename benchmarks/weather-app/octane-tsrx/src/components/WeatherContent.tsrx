import { memo } from 'octane';
import { CurrentWeather } from './CurrentWeather.tsrx';
import { Forecast } from './Forecast.tsrx';
import type { WeatherData } from '../types';

interface WeatherContentProps {
	isVisible: boolean;
	weatherData: WeatherData | null;
}

function WeatherContentImpl({ isVisible, weatherData }: WeatherContentProps) @{
	<div class="weather-content" data-testid="weather-content" hidden={!isVisible}>
		<div class="weather-layout">
			<CurrentWeather weatherData={weatherData} />
			<Forecast weatherData={weatherData} />
		</div>
	</div>
}

export const WeatherContent = memo(WeatherContentImpl);
