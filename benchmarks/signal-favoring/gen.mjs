// Generator for the signal-favoring bench fixtures.
//
// Emits the generated component sources for every target whose 100-component
// chain is maintained here. Adapter main files are intentionally hand-written:
// their framework-specific flush and batching contracts are too nuanced to
// regenerate from the component template. Stateful counters live at C1, C11, C21,
// ..., C91. On `__bumpAt<N>`, signal frameworks (solid, ripple) re-evaluate
// only the `{count}` text node inside CN; hook frameworks re-render CN and may
// cascade through CN+1..C100. React Compiler can skip unchanged descendants by
// caching eligible child elements. The bench measures the median cost of bumping
// at shallow, middle, and deep stateful positions plus MOUNT and UNMOUNT.
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
// octane (.tsrx, React-shape hooks)
// ----------------------------------------------------------------------------
function genRippleNew() {
	let out = `import { useState } from 'octane';\n\n`;
	out += `// 100 uniquely-named components in a chain. Stateful counters at C${STATEFUL_INDICES.join(', C')}.\n`;
	out += `// hook-frameworks cascade re-renders down the chain on each bump.\n\n`;
	// Module-level setters + bump exports
	for (const i of STATEFUL_INDICES) out += `let _set${i} = null;\n`;
	out += '\n';
	for (const i of STATEFUL_INDICES) {
		out += `export function bumpAt${i}() { if (_set${i}) _set${i}((v) => v + 1); }\n`;
	}
	out += '\n';
	// Define components in reverse order so each one's child is already declared
	// (TSRX hoists function declarations, but ordering keeps the file readable).
	for (let i = N; i >= 1; i--) {
		if (i === N) {
			out += `function C${i}(props) @{ <span class={props.kind}>${i}</span> }\n`;
		} else if (i === N - 1) {
			out += `function C${i}({ kind }) @{ <div class={kind}>${i} <C${i + 1} kind="leaf" /></div> }\n`;
		} else if (isStateful(i)) {
			out += `function C${i}(props) @{\n`;
			out += `  const [v, set] = useState(0);\n`;
			out += `  _set${i} = set;\n`;
			out += `  <div class='c'>${i}:{v as number} <C${i + 1} /></div>\n`;
			out += `}\n`;
		} else {
			const childProps = i === N - 2 ? ' kind="c"' : '';
			out += `function C${i}(props) @{ <div class='c'>${i} <C${i + 1}${childProps} /></div> }\n`;
		}
	}
	out += '\nexport default function App(props) @{ <C1 /> }\n';
	return out;
}

// ----------------------------------------------------------------------------
// octane JSX twin (React-style .tsx, same React-shape hooks)
// ----------------------------------------------------------------------------
// The same chain authored in React-style `.tsx` instead of `.tsrx`: `@{ … }`
// bodies become `return <jsx>`, `class` → `className`, and `{v as number}` →
// `{v}`. Octane's compiler lowers both dialects to the same runtime, so this is
// the JSX backwards-compat twin of genRippleNew() above.
function genOctaneJsx() {
	let out = `import { useState } from 'octane';\n\n`;
	out += `// 100 uniquely-named components in a chain. Stateful counters at C${STATEFUL_INDICES.join(', C')}.\n`;
	out += `// React-style .tsx twin of ../../octane-tsrx/src/App.tsrx — hook frameworks cascade\n`;
	out += `// re-renders down the chain on each bump.\n\n`;
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
// react (jsx, React 19 + React Compiler)
// ----------------------------------------------------------------------------
function genReact() {
	let out = `import { useState } from 'react';\n\n`;
	out += `// 100 uniquely-named components in a chain. Stateful counters at C${STATEFUL_INDICES.join(', C')}.\n`;
	out += `// React re-renders the owning component; React Compiler can skip unchanged descendants.\n\n`;
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
// preact (jsx, hook/VDOM model)
// ----------------------------------------------------------------------------
function genPreact() {
	return genReact()
		.replace("import { useState } from 'react';", "import { useState } from 'preact/hooks';")
		.replace(
			'// React re-renders the owning component; React Compiler can skip unchanged descendants.',
			'// Preact re-renders the owning component and cascades through its descendants.',
		);
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
// svelte (one generated SFC per component, matching the framework's native
// component compilation model)
// ----------------------------------------------------------------------------

function genSvelteComponent(i) {
	if (i === N) return `<span class="leaf">${i}</span>\n`;
	let out = `<script>\n\timport C${i + 1} from './C${i + 1}.svelte';\n`;
	if (isStateful(i)) {
		out =
			`<script module>\n\tlet update;\n\texport function bumpAt${i}() {\n\t\tupdate?.();\n\t}\n</script>\n\n` +
			out;
		out += `\n\tlet value = $state(0);\n\tupdate = () => {\n\t\tvalue += 1;\n\t};\n`;
	}
	out += `</script>\n\n<div class="c">${i}${isStateful(i) ? ':{value}' : ''} <C${i + 1} /></div>\n`;
	return out;
}

function genSvelteApp() {
	return `<script>\n\timport C1 from './C1.svelte';\n</script>\n\n<C1 />\n`;
}

// ----------------------------------------------------------------------------
// Emit
// ----------------------------------------------------------------------------

const targets = [
	{ rel: 'octane-tsrx/src/App.tsrx', content: genRippleNew() },
	{ rel: 'octane-jsx/src/App.tsx', content: genOctaneJsx() },
	{ rel: 'ripple/src/App.tsrx', content: genRipple() },
	{ rel: 'react/src/App.jsx', content: genReact() },
	{ rel: 'solid/src/App.jsx', content: genSolid() },
	{ rel: 'preact/src/App.jsx', content: genPreact() },
	{ rel: 'svelte/src/App.svelte', content: genSvelteApp() },
	...Array.from({ length: N }, (_, i) => ({
		rel: `svelte/src/C${i + 1}.svelte`,
		content: genSvelteComponent(i + 1),
	})),
];

for (const t of targets) {
	const path = resolve(HERE, t.rel);
	writeFileSync(path, t.content);
	console.log(`wrote ${t.rel} (${t.content.length} bytes)`);
}
console.log(`\nstateful indices: ${STATEFUL_INDICES.join(', ')}`);
console.log(`expose: window.__bumpAt${STATEFUL_INDICES.join(', __bumpAt')}`);
