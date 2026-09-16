import { effect, type Derived } from 'ripple';

interface SearchFormProps {
	onSearch: (city: string) => void | Promise<unknown>;
	isLoading: Derived<boolean>;
}

export function SearchForm({ onSearch, isLoading }: SearchFormProps) @{
	let inputRef: HTMLInputElement | undefined;

	effect(() => {
		const savedLocation = localStorage.getItem('weather-app-location');
		if (inputRef) {
			inputRef.value = savedLocation || 'London';
		}
	});

	const handleSubmit = (event: SubmitEvent) => {
		event.preventDefault();
		const city = inputRef?.value.trim();
		if (!city) return;
		void onSearch(city);
	};

	<section class="search-section">
		<form class="search-form" data-testid="search-form" onSubmit={handleSubmit}>
			<div class="search-form__group">
				<label for="location-input" class="sr-only">Enter city name</label>
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
					disabled={isLoading.value}
				>
					<span class="search-button__text">
						{isLoading.value ? 'Loading...' : 'Get Weather'}
					</span>
					<span class="search-button__icon">🌦️</span>
				</button>
			</div>
		</form>
	</section>
}
