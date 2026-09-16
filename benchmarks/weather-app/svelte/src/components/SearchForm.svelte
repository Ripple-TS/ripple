<script>
	import { onMount } from 'svelte';

	let { onSearch, isLoading = false } = $props();
	let inputValue = $state('');

	onMount(() => {
		try {
			inputValue = localStorage.getItem('weather-app-location') || 'London';
		} catch (storageError) {
			console.warn('Could not load saved location:', storageError);
			inputValue = 'London';
		}
	});

	function handleSubmit(event) {
		event.preventDefault();
		const city = inputValue.trim();
		if (!city) return;
		void onSearch(city);
	}
</script>

<section class="search-section">
	<form class="search-form" data-testid="search-form" onsubmit={handleSubmit}>
		<div class="search-form__group">
			<label for="location-input" class="sr-only">Enter city name</label>
			<input
				bind:value={inputValue}
				type="text"
				id="location-input"
				class="search-input"
				placeholder="Enter city name..."
				data-testid="search-input"
				autocomplete="off"
			/>
			<button type="submit" class="search-button" data-testid="search-button" disabled={isLoading}>
				<span class="search-button__text">{isLoading ? 'Loading...' : 'Get Weather'}</span>
				<span class="search-button__icon">🌦️</span>
			</button>
		</div>
	</form>
</section>
