import { createSignal, flush } from 'solid-js';

function getSavedLocation() {
	try {
		return localStorage.getItem('weather-app-location');
	} catch (error) {
		console.warn('Could not load saved location:', error);
		return null;
	}
}

function SearchForm(props) {
	const [inputValue, setInputValue] = createSignal(getSavedLocation() || 'London');

	const handleSubmit = (event) => {
		event.preventDefault();
		const city = inputValue().trim();
		if (!city) return;
		void props.onSearch(city);
	};

	return (
		<section class="search-section">
			<form class="search-form" data-testid="search-form" onSubmit={handleSubmit}>
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
						autocomplete="off"
						value={inputValue()}
						onInput={(event) => {
							setInputValue(event.currentTarget.value);
							flush();
						}}
					/>
					<button
						type="submit"
						class="search-button"
						data-testid="search-button"
						disabled={props.isLoading}
					>
						<span class="search-button__text">
							{props.isLoading ? 'Loading...' : 'Get Weather'}
						</span>
						<span class="search-button__icon">🌦️</span>
					</button>
				</div>
			</form>
		</section>
	);
}

export default SearchForm;
