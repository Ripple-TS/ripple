import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { measureSamples } from '../svg-dashboard/timing.mjs';

for (const withSetup of [false, true]) {
	test(`SVG samples exclude layout, GC, and setup costs (setup=${withSetup})`, async () => {
		let clock = 0;
		let dirty = true;
		let layoutReads = 0;
		let calls = 0;
		let preparations = 0;
		const context = {
			window: {
				gc() {
					clock += 23;
				},
				prepare() {
					preparations++;
					clock += 17;
					dirty = true;
				},
				mutate() {
					assert.equal(dirty, false, 'every invocation must start from laid-out DOM');
					clock += 7;
					calls++;
					dirty = true;
				},
			},
			document: {
				body: {
					get offsetHeight() {
						clock += 100;
						layoutReads++;
						dirty = false;
						return 800;
					},
				},
			},
			performance: { now: () => clock },
			setTimeout(callback) {
				clock += 30;
				callback();
			},
			args: {
				preSrc: withSetup ? 'window.prepare();' : null,
				bodySrc: 'window.mutate();',
				WARMUP: 2,
				ITER: 3,
				YIELD_MS: 5,
			},
		};
		const samples = await vm.runInNewContext(`(${measureSamples.toString()})(args)`, context);
		assert.deepEqual(Array.from(samples), [7, 7, 7]);
		assert.equal(calls, 5, 'warmup and measured invocations both execute');
		assert.equal(layoutReads, calls, 'layout must be flushed before every invocation');
		assert.equal(preparations, withSetup ? calls : 0);
	});
}
