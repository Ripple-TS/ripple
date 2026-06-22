// CPU-profile the MOUNT path by looping mount+reset in-page.
import { chromium } from 'playwright';

const url = process.argv[2] || 'http://localhost:5184/';
const reps = parseInt(process.argv[3] || '120', 10);

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const ctx = await browser.newContext();
const page = await ctx.newPage();
await page.goto(url, { waitUntil: 'load' });
await page.waitForFunction(() => window.__ready === true, null, { timeout: 10000 });

const session = await ctx.newCDPSession(page);
await session.send('Profiler.enable');
await session.send('Profiler.setSamplingInterval', { interval: 30 });
await session.send('Profiler.start');

await page.evaluate(async (reps) => {
	for (let i = 0; i < reps; i++) {
		window.__mount();
		window.__reset();
	}
}, reps);

const { profile } = await session.send('Profiler.stop');
await browser.close();

const nodes = new Map();
for (const n of profile.nodes) nodes.set(n.id, n);
const selfHits = new Map();
for (const id of profile.samples) selfHits.set(id, (selfHits.get(id) || 0) + 1);
const total = profile.samples.length;
const usPer = (profile.endTime - profile.startTime) / total;
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
	`\nmount+reset on ${url} — ${reps} reps, ${total} samples, ${((profile.endTime - profile.startTime) / 1000).toFixed(1)}ms profiled\n`,
);
console.log('self%    self-ms   function');
console.log('-------  --------  ----------------------------------------');
for (const [key, hits] of sorted.slice(0, 26)) {
	console.log(
		`${((hits / total) * 100).toFixed(1).padStart(6)}%  ${((hits * usPer) / 1000).toFixed(1).padStart(7)}  ${key}`,
	);
}
