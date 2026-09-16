import { useCallback, useEffect, useState } from 'octane';
import { ForecastItem } from './ForecastItem.tsrx';
import type { WeatherData } from '../types';

interface ForecastProps {
	weatherData: WeatherData | null;
}

export function Forecast({ weatherData }: ForecastProps) @{
	const [activeForecastIndex, setActiveForecastIndex] = useState<number | null>(null);

	const handleToggleForecast = useCallback((index: number) => {
		setActiveForecastIndex((currentIndex) => (currentIndex === index ? null : index));
	});

	useEffect(() => {
		if (activeForecastIndex === null) return;

		const timer = window.setTimeout(() => {
			const activeElement = document.querySelector('.forecast-item.active');
			activeElement?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
		}, 100);

		return () => window.clearTimeout(timer);
	});

	if (!weatherData) return null;
	const { daily } = weatherData;

	<section class="forecast-section">
		<h2 class="section-title">7-Day Forecast</h2>
		<div class="forecast">
			<div class="forecast__list" data-testid="forecast-list">
				@for (const date of daily.time; index index; key date) {
					<ForecastItem
						daily={daily}
						index={index}
						isActive={activeForecastIndex === index}
						onToggle={handleToggleForecast}
					/>
				}
			</div>
		</div>
	</section>
}
