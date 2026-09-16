import { memo, useCallback, useEffect, useRef } from 'octane';

interface SearchFormProps {
	onSearch: (city: string) => void | Promise<unknown>;
	isLoading: boolean;
}

function SearchFormImpl({ onSearch, isLoading }: SearchFormProps) @{
	const inputRef = useRef<HTMLInputElement | null>(null);

	useEffect(() => {
		const savedLocation = localStorage.getItem('weather-app-location');
		if (inputRef.current) {
			inputRef.current.value = savedLocation || 'London';
		}
	});

	const handleSubmit = useCallback((event: SubmitEvent) => {
		event.preventDefault();
		const city = inputRef.current?.value.trim();
		if (!city) return;
		void onSearch(city);
	});

	<section class="search-section">
		<form class="search-form" data-testid="search-form" onSubmit={handleSubmit}>
			<div class="search-form__group">
				<label htmlFor="location-input" class="sr-only">Enter city name</label>
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
					<span class="search-button__text">
						{isLoading ? 'Loading...' : 'Get Weather'}
					</span>
					<span class="search-button__icon">🌦️</span>
				</button>
			</div>
		</form>
	</section>
}

export const SearchForm = memo(SearchFormImpl);
