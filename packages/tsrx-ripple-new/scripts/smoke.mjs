import { compile } from './compile.js';

const cases = [
	{
		name: 'hello',
		src: `component Hello() {
  <div class="x">{text 'hi'}</div>
}`,
	},
	{
		name: 'counter',
		src: `import { useState } from 'ripple-new';
component Counter() {
  const [n, setN] = useState(0);
  <button onClick={() => setN(n + 1)}>{text n}</button>
}`,
	},
	{
		name: 'for-of',
		src: `component List() {
  <ul>
    for (const item of items) {
      <li key={item.id}>{text item.label}</li>
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
