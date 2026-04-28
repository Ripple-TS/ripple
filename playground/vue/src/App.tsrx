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
			const new_count = ref(0);
			<button onClick={() => new_count.value++}>
				{'New Count: '}
				{new_count.value}
			</button>
		}
	</main>
}

export component App(refs) {
	let refObj = useRef(null);
	function refA(_node) {}
	function refB(_node) {}
	function refC(_node) {}
	function refD(_node) {}
	<div {ref refA} {ref refA}>{'hi'}</div>
}
