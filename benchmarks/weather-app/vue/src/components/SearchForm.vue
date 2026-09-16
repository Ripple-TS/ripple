<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
	isLoading: { type: Boolean, required: true },
	currentValue: { type: String, required: true },
});
const emit = defineEmits(['search']);
const inputValue = ref(props.currentValue);

watch(
	() => props.currentValue,
	(value) => {
		inputValue.value = value;
	},
);

const handleSubmit = () => {
	const city = inputValue.value.trim();
	if (city) emit('search', city);
};
</script>

<template>
	<section class="search-section">
		<form class="search-form" data-testid="search-form" @submit.prevent="handleSubmit">
			<div class="search-form__group">
				<label for="location-input" class="sr-only">Enter city name</label>
				<input
					id="location-input"
					v-model="inputValue"
					type="text"
					class="search-input"
					placeholder="Enter city name..."
					data-testid="search-input"
					autocomplete="off"
				/>
				<button
					type="submit"
					class="search-button"
					data-testid="search-button"
					:disabled="isLoading"
				>
					<span class="search-button__text">
						{{ isLoading ? 'Loading...' : 'Get Weather' }}
					</span>
					<span class="search-button__icon">🌦️</span>
				</button>
			</div>
		</form>
	</section>
</template>
