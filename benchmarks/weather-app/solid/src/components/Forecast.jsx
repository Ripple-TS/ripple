import { createEffect, createSignal, For, Show } from 'solid-js';
import ForecastItem from './ForecastItem.jsx';

function Forecast(props) {
	const [activeForecastIndex, setActiveForecastIndex] = createSignal(null);

	const handleToggleForecast = (index) => {
		setActiveForecastIndex((currentIndex) => (currentIndex === index ? null : index));
	};

	createEffect(activeForecastIndex, (activeIndex) => {
		if (activeIndex === null) return undefined;

		const timer = setTimeout(() => {
			const activeElement = document.querySelector('.forecast-item.active');
			activeElement?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
		}, 100);
		return () => clearTimeout(timer);
	});

	return (
		<Show when={props.weatherData}>
			<section class="forecast-section">
				<h2 class="section-title">7-Day Forecast</h2>
				<div class="forecast">
					<div class="forecast__list" data-testid="forecast-list">
						<For each={props.weatherData.daily.time}>
							{(_date, index) => (
								<ForecastItem
									daily={props.weatherData.daily}
									index={index()}
									isActive={activeForecastIndex() === index()}
									onToggle={handleToggleForecast}
								/>
							)}
						</For>
					</div>
				</div>
			</section>
		</Show>
	);
}

export default Forecast;
