# Solid Playground

## Setup

Create a `src` folder in this directory, then add the two files below.

### `src/main.tsx`

```tsx
import { render } from '@solidjs/web';
import { App } from './App.tsrx';

const target = document.getElementById('root');
if (!target) throw new Error('#root not found');

render(() => <App />, target);
```

### `src/App.tsrx`

```tsrx
import { createSignal, onSettled } from 'solid-js';

function Child() {
  return <div class="child">{'I am a child component'}</div>;
}

export function App() {
  const [count, setCount] = createSignal(0);
  const items = [1, 2, 3];
  let buttonEl;

  onSettled(() => {
    console.log('mounted, button is', buttonEl);
  });

  return <>
    <Child />
    <h1>{'Hello Solid World'}</h1>
    if (count() > 5) {
      <div>{'count is big: ' + count()}</div>
    } else if (count() > 2) {
      <div>{'count is medium: ' + count()}</div>
    } else {
      <div>{'count is small: ' + count()}</div>
    }
    <button ref={buttonEl} onClick={() => setCount(count() + 1)}>
      {count()}
    </button>
    <ul>
      for (const item of items; index i) {
        <li>{'item ' + i() + ': ' + item}</li>
      }
    </ul>
    <tsx>
      <hr />
      <p>
        Fragment content via
        {' <tsx>...</tsx>'}
      </p>
    </tsx>
    <style>
      h1 {
        color: #2c4f7c;
        font-family: sans-serif;
      }

      button {
        padding: 8px 16px;
        border-radius: 4px;
        border: 1px solid #ccc;
        cursor: pointer;
      }

      .child {
        color: #888;
        font-style: italic;
      }
    </style>
  </>;
}
```

## Run

```bash
pnpm install
pnpm run dev
```
