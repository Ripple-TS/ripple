<script setup>
import { computed, ref, watch } from 'vue';
import ForecastItem from './ForecastItem.vue';

const props = defineProps({ weatherData: { type: Object, required: true } });
const activeIndex = ref(null);
const forecastItems = computed(() => {
	const daily = props.weatherData.daily;
	return daily.time.map((date, index) => ({ date, daily, index }));
});

const toggleItem = (index) => {
	activeIndex.value = activeIndex.value === index ? null : index;
};

watch(activeIndex, (index, _, onCleanup) => {
	if (index === null) return;
	const timer = setTimeout(() => {
		document
			.querySelector('.forecast-item.active')
			?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
	}, 100);
	onCleanup(() => clearTimeout(timer));
});
</script>

<template>
	<section class="forecast-section">
		<h2 class="section-title">7-Day Forecast</h2>
		<div class="forecast">
			<div class="forecast__list" data-testid="forecast-list">
				<ForecastItem
					v-for="item in forecastItems"
					:key="item.date"
					:daily="item.daily"
					:index="item.index"
					:is-active="activeIndex === item.index"
					@toggle="toggleItem(item.index)"
				/>
			</div>
		</div>
	</section>
</template>
