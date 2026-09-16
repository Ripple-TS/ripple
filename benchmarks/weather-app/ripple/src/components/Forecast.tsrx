import { track, effect, type Derived } from 'ripple';
import { ForecastItem } from './ForecastItem.tsrx';
import type { WeatherData } from '../types';

interface ForecastProps {
	weatherData: Derived<WeatherData | null>;
}

export function Forecast({ weatherData }: ForecastProps) @{
	const activeForecastIndex = track<number | null>(null);

	const handleToggleForecast = (index: number) => {
		activeForecastIndex.value = activeForecastIndex.value === index ? null : index;
	};

	effect(() => {
		if (activeForecastIndex.value === null) return;

		const timer = window.setTimeout(() => {
			const activeElement = document.querySelector('.forecast-item.active');
			activeElement?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
		}, 100);

		return () => window.clearTimeout(timer);
	});

	const daily = track(() => weatherData.value!.daily);

	@if (weatherData.value !== null) {
		<section class="forecast-section">
			<h2 class="section-title">7-Day Forecast</h2>
			<div class="forecast">
				<div class="forecast__list" data-testid="forecast-list">
					@for (const date of daily.value.time; index index; key date) {
						<ForecastItem
							daily={daily}
							index={index}
							isActive={track(() => activeForecastIndex.value === index)}
							onToggle={handleToggleForecast}
						/>
					}
				</div>
			</div>
		</section>
	}
}
