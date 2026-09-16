import { useCallback, useEffect, useRef } from 'preact/hooks';

const SearchForm = ({ onSearch, isLoading }) => {
	const inputRef = useRef(null);

	useEffect(() => {
		const savedLocation = localStorage.getItem('weather-app-location');
		if (savedLocation && inputRef.current) {
			inputRef.current.value = savedLocation;
		} else if (inputRef.current) {
			inputRef.current.value = 'London';
		}
	}, []);

	const handleSubmit = useCallback(
		(event) => {
			event.preventDefault();
			const city = inputRef.current?.value?.trim();

			if (!city) {
				return;
			}

			onSearch(city);
		},
		[onSearch],
	);

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
						autoComplete="off"
						ref={inputRef}
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
};

export default SearchForm;
