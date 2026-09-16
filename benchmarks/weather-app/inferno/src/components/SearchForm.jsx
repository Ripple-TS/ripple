import { Component } from 'inferno';

export default class SearchForm extends Component {
	componentDidMount() {
		const savedLocation = localStorage.getItem('weather-app-location');
		if (this.input) this.input.value = savedLocation || 'London';
	}

	handleSubmit = (event) => {
		event.preventDefault();
		const city = this.input?.value?.trim();
		if (city) this.props.onSearch(city);
	};

	render() {
		const { isLoading } = this.props;

		return (
			<section class="search-section">
				<form class="search-form" data-testid="search-form" onSubmit={this.handleSubmit}>
					<div class="search-form__group">
						<label for="location-input" class="sr-only">
							Enter city name
						</label>
						<input
							type="text"
							id="location-input"
							class="search-input"
							placeholder="Enter city name..."
							data-testid="search-input"
							autoComplete="off"
							ref={(input) => {
								this.input = input;
							}}
						/>
						<button
							type="submit"
							class="search-button"
							data-testid="search-button"
							disabled={isLoading}
						>
							<span class="search-button__text">{isLoading ? 'Loading...' : 'Get Weather'}</span>
							<span class="search-button__icon">🌦️</span>
						</button>
					</div>
				</form>
			</section>
		);
	}
}
