import { useState } from 'react';

export component App() {
	const [count, setCount] = useState(0);

	if (count > 1) {
		<div>{'Count is more than one'}</div>
	}

	<button onClick={() => setCount(count + 1)}>{count}</button>

	<style>
		button {
			border: 0;
			color: red;
		}
	</style>
}
