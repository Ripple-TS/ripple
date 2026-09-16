import { Component } from 'inferno';
import ForecastItem from './ForecastItem';

export default class Forecast extends Component {
	constructor(props) {
		super(props);
		this.state = { activeForecastIndex: null };
	}

	componentDidUpdate(_previousProps, previousState) {
		const { activeForecastIndex } = this.state;
		if (previousState.activeForecastIndex === activeForecastIndex) return;
		clearTimeout(this.scrollTimer);
		if (activeForecastIndex === null) return;
		this.scrollTimer = setTimeout(() => {
			document
				.querySelector('.forecast-item.active')
				?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
		}, 100);
	}

	componentWillUnmount() {
		clearTimeout(this.scrollTimer);
	}

	handleToggleForecast = (index) => {
		this.setState(({ activeForecastIndex }) => ({
			activeForecastIndex: activeForecastIndex === index ? null : index,
		}));
	};

	render() {
		const { weatherData } = this.props;
		if (!weatherData) return null;
		const { activeForecastIndex } = this.state;
		const { daily } = weatherData;

		return (
			<section class="forecast-section">
				<h2 class="section-title">7-Day Forecast</h2>
				<div class="forecast">
					<div class="forecast__list" data-testid="forecast-list">
						{daily.time.map((date, index) => (
							<ForecastItem
								key={date}
								daily={daily}
								index={index}
								isActive={activeForecastIndex === index}
								onToggle={this.handleToggleForecast}
							/>
						))}
					</div>
				</div>
			</section>
		);
	}
}
