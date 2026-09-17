// Self-contained for Playwright's page.evaluate and the timing-contract test.
export async function measureSamples({ preSrc, bodySrc, WARMUP, ITER, YIELD_MS }) {
	const pre = preSrc ? new Function(preSrc) : null;
	const fn = new Function(bodySrc);
	const gc = window.gc || (() => {});
	const yieldTask = () => new Promise((resolve) => setTimeout(resolve, YIELD_MS));
	const samples = [];
	for (let i = 0; i < WARMUP + ITER; i++) {
		if (pre) pre();
		await yieldTask();
		gc();
		// Time from a laid-out tree: nodes with layout boxes cost more to move or
		// remove, and whether a frame ran before the timer is otherwise up to the
		// browser.
		void document.body?.offsetHeight;
		const t0 = performance.now();
		fn();
		const elapsed = performance.now() - t0;
		if (i >= WARMUP) samples.push(elapsed);
	}
	return samples;
}
