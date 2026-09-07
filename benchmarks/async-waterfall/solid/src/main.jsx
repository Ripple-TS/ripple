import { render } from '@solidjs/web';
import { createSignal, createMemo, createLoadingBoundary } from 'solid-js';
import { fetchData, LEVELS } from './data.js';

// Solid 2.0 async: a memo whose compute returns a promise auto-unwraps — reads
// throw NotReadyError while pending, caught by the loading boundary. The
// boundary wraps ONLY the value span, so the child level below is created
// immediately and all 10 fetches start in parallel: no waterfall by model.
// Updates re-run each level's memo off the version signal — fine-grained, no
// re-render cascade.
const [version, setVersion] = createSignal(0);
window.__bump = () => setVersion((v) => v + 1);

function Level(props) {
	const data = createMemo(() => fetchData(props.level, version()));
	return (
		<div class="level" data-level={props.level}>
			{createLoadingBoundary(
				() => (
					<span class="val">{data()}</span>
				),
				() => (
					<span class="val">…</span>
				),
			)}
			{props.level < LEVELS - 1 ? <Level level={props.level + 1} /> : null}
		</div>
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

let v = 0;

window.__init = () => {
	const t0 = performance.now();
	render(() => <Level level={0} />, target);
	return waitForDeep(`L${LEVELS - 1}:v0`, t0);
};

window.__update = () => {
	v += 1;
	const t0 = performance.now();
	window.__bump();
	return waitForDeep(`L${LEVELS - 1}:v${v}`, t0);
};
