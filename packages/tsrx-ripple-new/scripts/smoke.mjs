import { compile } from '../src/compile.js';

// Quick manual smoke check — compiles a few representative components and prints
// the emitted ripple-new code. Run with `pnpm smoke`. For assertions, see
// tests/compile.test.js (run via `pnpm test --project tsrx-ripple-new`).

const cases = [
	{
		name: 'hello',
		src: `export function Hello() @{
  <div class="x">{'hi'}</div>
}`,
	},
	{
		name: 'counter',
		src: `import { useState } from 'ripple-new';
export function Counter() @{
  const [n, setN] = useState(0);
  <button onClick={() => setN(n + 1)}>{n as number}</button>
}`,
	},
	{
		name: 'for-of',
		src: `export function List(props) @{
  <ul>
    @for (const item of props.items; key item.id) {
      <li>{item.label as string}</li>
    }
  </ul>
}`,
	},
];

for (const c of cases) {
	console.log(`---- ${c.name} ----`);
	try {
		const out = compile(c.src, `${c.name}.tsrx`);
		console.log(out.code);
	} catch (e) {
		console.log('ERROR:', e.message);
		console.log(e.stack);
	}
	console.log();
}
