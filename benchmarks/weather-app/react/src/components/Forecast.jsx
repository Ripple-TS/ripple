import React, { useState, useEffect, useCallback } from 'react';
import ForecastItem from './ForecastItem';

const Forecast = ({ weatherData }) => {
	const [activeForecastIndex, setActiveForecastIndex] = useState(null);

	const handleToggleForecast = useCallback((index) => {
		setActiveForecastIndex((currentIndex) => (currentIndex === index ? null : index));
	}, []);

	useEffect(() => {
		if (activeForecastIndex === null) return undefined;

		const timer = setTimeout(() => {
			const activeElement = document.querySelector('.forecast-item.active');
			if (activeElement) {
				activeElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
			}
		}, 100);

		return () => clearTimeout(timer);
	}, [activeForecastIndex]);

	if (!weatherData) {
		return null;
	}

	const { daily } = weatherData;

	return (
		<section className="forecast-section">
			<h2 className="section-title">7-Day Forecast</h2>
			<div className="forecast">
				<div className="forecast__list" data-testid="forecast-list">
					{daily.time.map((date, index) => (
						<ForecastItem
							key={date}
							daily={daily}
							index={index}
							isActive={activeForecastIndex === index}
							onToggle={handleToggleForecast}
						/>
					))}
				</div>
			</div>
		</section>
	);
};

export default Forecast;
