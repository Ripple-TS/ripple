import { ref } from 'vue';

export default component App() {
	const count = ref(0);

	<main>
		<h1>{'Hello from TSRX Vue'}</h1>
		<p>{'Edit playground/vue/src/App.tsrx to try the Vue target locally.'}</p>
		<button onClick={() => count.value++}>
			{'Count: '}
			{count.value}
		</button>
		console.log('foo');
		if (count.value > 2) {
			<div>{'Bigger than two'}</div>
		}
	</main>
}
