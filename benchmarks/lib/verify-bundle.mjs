import { preview } from 'vite';
import { chromium } from 'playwright';

// Byte measurements are accepted only for executable production artifacts.
// This untimed smoke check uses the same public interactions as the UI suites.
export async function verifyBundle(root, outDir, workload) {
	const server = await preview({
		root,
		build: { outDir },
		preview: { host: '127.0.0.1', port: 0, strictPort: false, open: false },
	});
	let browser;
	try {
		browser = await chromium.launch({ headless: true });
		const page = await browser.newPage();
		const errors = [];
		page.on('pageerror', (error) => errors.push(error.message));
		const address = server.httpServer.address();
		await page.goto(`http://127.0.0.1:${address.port}/`);
		if (workload === 'rows') {
			await page.locator('#run').click();
			await page.waitForFunction(() => document.querySelectorAll('tbody tr').length === 1000);
			await page.locator('#clear').click();
			await page.waitForFunction(() => document.querySelectorAll('tbody tr').length === 0);
		} else if (workload === 'todo') {
			await page.locator('.new-todo').fill('Verify production bundle');
			await page.locator('.new-todo').press('Enter');
			await page.waitForFunction(() =>
				document.querySelector('.todo-list li')?.textContent.includes('Verify production bundle'),
			);
		} else if (workload === 'chat') {
			await page.locator('.prompt').fill('Verify production bundle');
			await page.locator('.send').click();
			await page.waitForFunction(() =>
				document.querySelector('.messages')?.textContent.includes('Verify production bundle'),
			);
			await page.evaluate(async () => {
				let guard = 0;
				while (window.__pump(64) > 0) {
					await window.__benchFlush?.();
					if (++guard > 10000) throw Error('Stream did not settle');
				}
				await window.__benchFlush?.();
			});
			await page.waitForFunction(() => document.querySelectorAll('.streaming').length === 0);
		} else throw Error(`Unknown bundle workload: ${workload}`);
		if (errors.length) throw Error(errors.join('; '));
		return 'pass';
	} finally {
		await browser?.close();
		server.httpServer.closeAllConnections();
		await new Promise((resolve, reject) =>
			server.httpServer.close((error) => (error ? reject(error) : resolve())),
		);
	}
}
