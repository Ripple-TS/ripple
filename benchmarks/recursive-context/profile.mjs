// CPU-profile a single bench op for a target. Usage:
//   node profile.mjs <url> <fnName> <reps>
// Captures a CDP CPU profile while looping the op, then prints the hottest
// self-time functions aggregated by function name + file:line.
import { chromium } from 'playwright';

const url = process.argv[2] || 'http://localhost:5184/';
const fnName = process.argv[3] || '__updatePartial';
const reps = parseInt(process.argv[4] || '400', 10);

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const ctx = await browser.newContext();
const page = await ctx.newPage();
await page.goto(url, { waitUntil: 'load' });
await page.waitForFunction(() => window.__ready === true, null, { timeout: 10000 });
await page.evaluate(() => window.__mount());
await new Promise((r) => setTimeout(r, 100));

const session = await ctx.newCDPSession(page);
await session.send('Profiler.enable');
await session.send('Profiler.setSamplingInterval', { interval: 20 }); // 20µs
await session.send('Profiler.start');

await page.evaluate(
	async ({ fnName, reps }) => {
		for (let i = 0; i < reps; i++) {
			window[fnName]();
			// no rAF wait — flushSync is synchronous; keep the loop tight
		}
	},
	{ fnName, reps },
);

const { profile } = await session.send('Profiler.stop');
await browser.close();

// Aggregate self time by node id (sample counts → time via deltas).
const nodes = new Map();
for (const n of profile.nodes) nodes.set(n.id, n);

const selfHits = new Map(); // id -> sample count
for (const id of profile.samples) selfHits.set(id, (selfHits.get(id) || 0) + 1);

const totalSamples = profile.samples.length;
const totalTimeUs = profile.endTime - profile.startTime;
const usPerSample = totalTimeUs / totalSamples;

// Aggregate by function key.
const byFn = new Map();
for (const [id, hits] of selfHits) {
	const n = nodes.get(id);
	if (!n) continue;
	const cf = n.callFrame;
	const file = (cf.url || '').split('/').slice(-1)[0];
	const key = `${cf.functionName || '(anon)'} @ ${file}:${cf.lineNumber + 1}`;
	byFn.set(key, (byFn.get(key) || 0) + hits);
}

const sorted = [...byFn.entries()].sort((a, b) => b[1] - a[1]);
console.log(
	`\n${fnName} on ${url} — ${reps} reps, ${totalSamples} samples, ${(totalTimeUs / 1000).toFixed(1)}ms total profiled\n`,
);
console.log('self%    self-ms   function');
console.log('-------  --------  ----------------------------------------');
for (const [key, hits] of sorted.slice(0, 28)) {
	const pct = ((hits / totalSamples) * 100).toFixed(1);
	const ms = ((hits * usPerSample) / 1000).toFixed(1);
	console.log(`${pct.padStart(6)}%  ${ms.padStart(7)}  ${key}`);
}
