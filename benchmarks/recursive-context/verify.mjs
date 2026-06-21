// Correctness probe: mount, then check DOM reflects root/partial updates correctly.
import { chromium } from 'playwright';

const url = process.argv[2] || 'http://localhost:5184/';
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.goto(url, { waitUntil: 'load' });
await page.waitForFunction(() => window.__ready === true, null, { timeout: 10000 });

const snap = () =>
	page.evaluate(() => {
		const leaves = [...document.querySelectorAll('.leaf')].map((n) => n.textContent);
		// Leaf text is `path|root:local`. Tally distinct root and local values seen.
		const roots = {};
		const locals = {};
		let midLeaves = 0;
		for (const t of leaves) {
			const [path, rest] = t.split('|');
			const [r, l] = rest.split(':');
			roots[r] = (roots[r] || 0) + 1;
			locals[l] = (locals[l] || 0) + 1;
			if (path.startsWith('LLLLL')) midLeaves++;
		}
		return { count: leaves.length, roots, locals, midLeaves };
	});

await page.evaluate(() => window.__mount());
await new Promise((r) => setTimeout(r, 50));
console.log('after mount:      ', JSON.stringify(await snap()));

await page.evaluate(() => window.__updateRoot());
await new Promise((r) => setTimeout(r, 50));
console.log('after updateRoot: ', JSON.stringify(await snap()));

await page.evaluate(() => window.__updatePartial());
await new Promise((r) => setTimeout(r, 50));
console.log('after partial:    ', JSON.stringify(await snap()));

await page.evaluate(() => {
	window.__updateRoot();
	window.__updateRoot();
});
await new Promise((r) => setTimeout(r, 50));
console.log('after 2x root:    ', JSON.stringify(await snap()));

await page.evaluate(() => window.__partialUnmount());
await new Promise((r) => setTimeout(r, 50));
console.log('after p-unmount:  ', JSON.stringify(await snap()));

await page.evaluate(() => window.__partialRemount());
await new Promise((r) => setTimeout(r, 50));
console.log('after p-remount:  ', JSON.stringify(await snap()));

await browser.close();
