import { useState, useEffect } from 'react';

component Child() {
	<div>
		const x = 1;

		console.log(x);
	</div>
}

export component App() {
	const [count, setCount] = useState(0);
	const items = [1, 2, 3];

	<Child />

	<h1>
		{'Hello World'}
		if (count > 1) {
			return;
		}
	</h1>

	if (count > 1) {
		<div>
			const [x] = useState(1);

			{'Count is more than ' + x}
		</div>
	}

	useEffect(() => {
		console.log(count);
	}, [count]);

	<button onClick={() => setCount(count + 1)}>{count}</button>

	if (count > 2) {
		return;
	}

	for (const item of items; index i) {
		<div key={i}>{item}</div>
	}

	<style>
		button {
			border: 0;
			color: red;
		}
	</style>
}
