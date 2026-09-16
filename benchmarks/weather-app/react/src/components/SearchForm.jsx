import React, { useRef, useEffect, useCallback } from 'react';

const SearchForm = ({ onSearch, isLoading }) => {
	const inputRef = useRef(null);

	useEffect(() => {
		// Set initial value from localStorage
		const savedLocation = localStorage.getItem('weather-app-location');
		if (savedLocation && inputRef.current) {
			inputRef.current.value = savedLocation;
		} else if (inputRef.current) {
			inputRef.current.value = 'London';
		}
	}, []);

	const handleSubmit = useCallback(
		(e) => {
			e.preventDefault();
			const city = inputRef.current?.value?.trim();

			if (!city) {
				return;
			}

			onSearch(city);
		},
		[onSearch],
	);

	return (
		<section className="search-section">
			<form className="search-form" data-testid="search-form" onSubmit={handleSubmit}>
				<div className="search-form__group">
					<label htmlFor="location-input" className="sr-only">
						Enter city name
					</label>
					<input
						type="text"
						id="location-input"
						className="search-input"
						placeholder="Enter city name..."
						data-testid="search-input"
						autoComplete="off"
						ref={inputRef}
					/>
					<button
						type="submit"
						className="search-button"
						data-testid="search-button"
						disabled={isLoading}
					>
						<span className="search-button__text">{isLoading ? 'Loading...' : 'Get Weather'}</span>
						<span className="search-button__icon">🌦️</span>
					</button>
				</div>
			</form>
		</section>
	);
};

export default React.memo(SearchForm);
