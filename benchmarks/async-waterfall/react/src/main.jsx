import { createRoot } from 'react-dom/client';
import { Suspense, use, useState, startTransition } from 'react';
import { fetchData, LEVELS } from './data.js';

// One async component per nesting level — `use(fetch)` suspends this level, so
// the child below only mounts (and only starts fetching) after this level's
// promise resolved: the canonical React nested-`use` waterfall. Updates re-run
// the cascade inside a transition (old content stays visible).
function Level({ level, version }) {
	const data = use(fetchData(level, version));
	return (
		<div className="level" data-level={level}>
			<span className="val">{data}</span>
			{level < LEVELS - 1 ? <Level level={level + 1} version={version} /> : null}
		</div>
	);
}

function Main() {
	const [version, setVersion] = useState(0);
	window.__bump = () => startTransition(() => setVersion((v) => v + 1));
	return (
		<Suspense fallback={<p className="loading">loading…</p>}>
			<Level level={0} version={version} />
		</Suspense>
	);
}

const target = document.getElementById('main');
const DEEP = `[data-level="${LEVELS - 1}"] .val`;

function waitForDeep(text, t0) {
	return new Promise((resolve) => {
		const check = () => {
			const el = document.querySelector(DEEP);
			if (el && el.textContent === text) {
				obs.disconnect();
				resolve(performance.now() - t0);
			}
		};
		const obs = new MutationObserver(check);
		obs.observe(document.body, { childList: true, characterData: true, subtree: true });
		check();
	});
}

let version = 0;

window.__init = () => {
	const t0 = performance.now();
	createRoot(target).render(<Main />);
	return waitForDeep(`L${LEVELS - 1}:v0`, t0);
};

window.__update = () => {
	version += 1;
	const t0 = performance.now();
	window.__bump();
	return waitForDeep(`L${LEVELS - 1}:v${version}`, t0);
};
