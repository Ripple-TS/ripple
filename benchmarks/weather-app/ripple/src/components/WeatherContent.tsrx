import { type Derived } from 'ripple';
import { CurrentWeather } from './CurrentWeather.tsrx';
import { Forecast } from './Forecast.tsrx';
import type { WeatherData } from '../types';

interface WeatherContentProps {
	isVisible: Derived<boolean>;
	weatherData: Derived<WeatherData | null>;
}

export function WeatherContent({ isVisible, weatherData }: WeatherContentProps) @{
	<div class="weather-content" data-testid="weather-content" hidden={!isVisible.value}>
		<div class="weather-layout">
			<CurrentWeather weatherData={weatherData} />
			<Forecast weatherData={weatherData} />
		</div>
	</div>
}
