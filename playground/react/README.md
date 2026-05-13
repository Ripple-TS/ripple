# React Playground

## Setup

Create a `src` folder in this directory, then add the two files below.

### `src/main.tsx`

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App.tsrx';

const target = document.getElementById('root');
if (!target) throw new Error('#root not found');

createRoot(target).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

### `src/App.tsrx`

```tsx
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
```

## Run

```bash
pnpm install
pnpm run dev
```
