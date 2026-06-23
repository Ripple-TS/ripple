// Generator for the signal-favoring bench fixtures.
//
// Emits four <framework>/src/App.* files: 100 uniquely-named components in a
// linear chain C1 → C2 → ... → C100. Stateful counters live at C1, C11, C21,
// ..., C91. On `__bumpAt<N>`, signal frameworks (solid, ripple) re-evaluate
// only the `{count}` text node inside CN; hook frameworks (react)
// re-render CN and cascade through CN+1..C100. The bench measures the median
// cost of bumping at shallow, middle, and deep stateful positions plus
// MOUNT and UNMOUNT.
//
// Run: `node benchmarks/signal-favoring/gen.mjs`

import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));

const N = 100;
const STATEFUL_INDICES = [];
for (let i = 1; i <= N; i += 10) STATEFUL_INDICES.push(i);

const isStateful = (i) => i % 10 === 1;

// ----------------------------------------------------------------------------
// ripple (existing framework, signal-based via track)
// ----------------------------------------------------------------------------
function genRipple() {
	let out = `import { track } from 'ripple';\n\n`;
	out += `// 100 uniquely-named components in a chain. Stateful counters at C${STATEFUL_INDICES.join(', C')}.\n`;
	out += `// signal-frameworks update only the {v} text expression; CN+1..C100 are untouched.\n\n`;
	// Setter closures captured during render — each stateful body assigns its
	// _setN on render. Bodies run once, setters stay valid for the lifetime.
	for (const i of STATEFUL_INDICES) out += `let _set${i}: any = null;\n`;
	out += '\n';
	for (const i of STATEFUL_INDICES) {
		out += `export function bumpAt${i}() { if (_set${i}) _set${i}(); }\n`;
	}
	out += '\n';
	for (let i = N; i >= 1; i--) {
		if (i === N) {
			out += `function C${i}(props) @{ <span class='leaf'>${i}</span> }\n`;
		} else if (isStateful(i)) {
			out += `function C${i}(props) @{\n`;
			out += `  let &[v] = track(0);\n`;
			out += `  _set${i} = () => { v += 1; };\n`;
			out += `  <div class='c'>${i}:{v} <C${i + 1} /></div>\n`;
			out += `}\n`;
		} else {
			out += `function C${i}(props) @{ <div class='c'>${i} <C${i + 1} /></div> }\n`;
		}
	}
	out += '\nexport default function App(props) @{ <C1 /> }\n';
	return out;
}

// ----------------------------------------------------------------------------
// react (jsx, React 19)
// ----------------------------------------------------------------------------
function genReact() {
	let out = `import { useState } from 'react';\n\n`;
	out += `// 100 uniquely-named components in a chain. Stateful counters at C${STATEFUL_INDICES.join(', C')}.\n`;
	out += `// React re-renders the owning component and cascades through its descendants.\n\n`;
	for (const i of STATEFUL_INDICES) out += `let _set${i} = null;\n`;
	out += '\n';
	for (const i of STATEFUL_INDICES) {
		out += `export function bumpAt${i}() { if (_set${i}) _set${i}((v) => v + 1); }\n`;
	}
	out += '\n';
	for (let i = N; i >= 1; i--) {
		if (i === N) {
			out += `function C${i}() { return <span className="leaf">${i}</span>; }\n`;
		} else if (isStateful(i)) {
			out += `function C${i}() {\n`;
			out += `  const [v, set] = useState(0);\n`;
			out += `  _set${i} = set;\n`;
			out += `  return <div className="c">${i}:{v} <C${i + 1} /></div>;\n`;
			out += `}\n`;
		} else {
			out += `function C${i}() { return <div className="c">${i} <C${i + 1} /></div>; }\n`;
		}
	}
	out += '\nexport default function App() { return <C1 />; }\n';
	return out;
}

// ----------------------------------------------------------------------------
// solid (jsx, Solid 2.0)
// ----------------------------------------------------------------------------
function genSolid() {
	let out = `import { createSignal } from 'solid-js';\n\n`;
	out += `// 100 uniquely-named components in a chain. Stateful counters at C${STATEFUL_INDICES.join(', C')}.\n`;
	out += `// Solid 2.0: component bodies run once. Signal writes re-evaluate only\n`;
	out += `// the JSX expression that read the signal — descendant Cs are untouched.\n\n`;
	for (const i of STATEFUL_INDICES) out += `let _set${i} = null;\n`;
	out += '\n';
	for (const i of STATEFUL_INDICES) {
		out += `export function bumpAt${i}() { if (_set${i}) _set${i}((v) => v + 1); }\n`;
	}
	out += '\n';
	for (let i = N; i >= 1; i--) {
		if (i === N) {
			out += `function C${i}() { return <span class="leaf">${i}</span>; }\n`;
		} else if (isStateful(i)) {
			out += `function C${i}() {\n`;
			out += `  const [v, set] = createSignal(0);\n`;
			out += `  _set${i} = set;\n`;
			out += `  return <div class="c">${i}:{v()} <C${i + 1} /></div>;\n`;
			out += `}\n`;
		} else {
			out += `function C${i}() { return <div class="c">${i} <C${i + 1} /></div>; }\n`;
		}
	}
	out += '\nexport default function App() { return <C1 />; }\n';
	return out;
}

// ----------------------------------------------------------------------------
// main.{js,jsx} per framework — each imports the App + 10 bump fns and
// installs window.__mount/__unmount/__reset/__ready + window.__bumpAt<N>.
// ----------------------------------------------------------------------------

const bumpImports = STATEFUL_INDICES.map((i) => `bumpAt${i}`).join(', ');
const bumpExports = STATEFUL_INDICES.map(
	(i) => `window.__bumpAt${i} = () => __WRAP__(bumpAt${i});`,
).join('\n');

function genRippleMain() {
	let out = `import { mount, flushSync } from 'ripple';\n`;
	out += `import App, { ${bumpImports} } from './App.tsrx';\n\n`;
	out += `const target = document.getElementById('main');\n`;
	out += `let unmount = null;\n\n`;
	out += `window.__mount = () => { unmount = mount(App, { target, props: {} }); };\n`;
	out += `window.__unmount = () => { if (unmount) { unmount(); unmount = null; } };\n`;
	out += `window.__reset = () => {\n`;
	out += `  if (unmount) { unmount(); unmount = null; }\n`;
	out += `  while (target.firstChild) target.removeChild(target.firstChild);\n`;
	out += `};\n`;
	out += bumpExports.replace(/__WRAP__/g, 'flushSync') + '\n';
	out += `window.__ready = true;\n`;
	return out;
}

function genReactMain() {
	let out = `import { createRoot } from 'react-dom/client';\n`;
	out += `import { flushSync } from 'react-dom';\n`;
	out += `import { createElement } from 'react';\n`;
	out += `import App, { ${bumpImports} } from './App.jsx';\n\n`;
	out += `const target = document.getElementById('main');\n`;
	out += `let root = null;\n\n`;
	out += `window.__mount = () => {\n`;
	out += `  root = createRoot(target);\n`;
	out += `  flushSync(() => root.render(createElement(App)));\n`;
	out += `};\n`;
	out += `window.__unmount = () => { if (root) { root.unmount(); root = null; } };\n`;
	out += `window.__reset = () => {\n`;
	out += `  if (root) { root.unmount(); root = null; }\n`;
	out += `  while (target.firstChild) target.removeChild(target.firstChild);\n`;
	out += `};\n`;
	// React's flushSync takes a thunk, same shape as ripple.
	out += bumpExports.replace(/__WRAP__/g, 'flushSync') + '\n';
	out += `window.__ready = true;\n`;
	return out;
}

function genSolidMain() {
	let out = `import { render } from '@solidjs/web';\n`;
	out += `import App, { ${bumpImports} } from './App.jsx';\n\n`;
	out += `const target = document.getElementById('main');\n`;
	out += `let dispose = null;\n\n`;
	out += `window.__mount = () => { dispose = render(() => <App />, target); };\n`;
	out += `window.__unmount = () => { if (dispose) { dispose(); dispose = null; } };\n`;
	out += `window.__reset = () => {\n`;
	out += `  if (dispose) { dispose(); dispose = null; }\n`;
	out += `  while (target.firstChild) target.removeChild(target.firstChild);\n`;
	out += `};\n`;
	// Solid signal sets are synchronous; harness rAF gate handles paint settling.
	out += bumpExports.replace(/__WRAP__\((.*?)\)/g, '$1()') + '\n';
	out += `window.__ready = true;\n`;
	return out;
}

// ----------------------------------------------------------------------------
// Emit
// ----------------------------------------------------------------------------

const targets = [
	{ rel: 'ripple/src/App.tsrx', content: genRipple() },
	{ rel: 'ripple/src/main.js', content: genRippleMain() },
	{ rel: 'react/src/App.jsx', content: genReact() },
	{ rel: 'react/src/main.jsx', content: genReactMain() },
	{ rel: 'solid/src/App.jsx', content: genSolid() },
	{ rel: 'solid/src/main.jsx', content: genSolidMain() },
];

for (const t of targets) {
	const path = resolve(HERE, t.rel);
	writeFileSync(path, t.content);
	console.log(`wrote ${t.rel} (${t.content.length} bytes)`);
}
console.log(`\nstateful indices: ${STATEFUL_INDICES.join(', ')}`);
console.log(`expose: window.__bumpAt${STATEFUL_INDICES.join(', __bumpAt')}`);
