// Time the click and its DOM commit without adding a frame or paint wait. A
// gc() right before each sample keeps a surprise collection from inflating it.
//
// Targets that schedule a later commit expose window.__benchFlush: Octane uses
// public flushSync and Vue awaits nextTick. The call stays in the timed window.
// Verify the resulting DOM after t1, before any further async work, so this
// semantic gate cannot inflate the timing or accidentally observe a later commit.
export async function timeClick(page, op, selector) {
	return await page.evaluate(
		async ({ op, selector }) => {
			const el = document.querySelector(selector);
			if (!el) throw new Error('selector not found: ' + selector);
			const tbody = document.querySelector('tbody');
			const firstRow = tbody?.querySelector('tr');
			const secondRow = op === 'swap' ? tbody?.rows[1] : null;
			const removedRow = op === 'remove' ? el.closest('tr') : null;
			const oldLabel =
				op === 'update' ? firstRow?.querySelector('td:nth-child(2) a')?.textContent : null;
			const flush = window.__benchFlush;
			(window.gc || (() => {}))();
			// Start from laid-out rows: a sample whose rows never got style and
			// layout moves nodes far more cheaply, and whether a frame rendered
			// during the settle sleep is otherwise up to the browser.
			void document.body?.offsetHeight;
			const t0 = performance.now();
			el.click();
			if (flush) await flush();
			const elapsed = performance.now() - t0;
			const expectedRows = {
				run: 1000,
				replace: 1000,
				add: 2000,
				update: 1000,
				select: 1000,
				swap: 1000,
				remove: 999,
				runlots: 10000,
				select_lots: 10000,
				clear: 0,
				clear_1k: 0,
			}[op];
			if (tbody?.rows.length !== expectedRows) {
				throw new Error(
					`${op}: commit was not inside timed click (expected ${expectedRows} rows, found ${tbody?.rows.length})`,
				);
			}
			if (
				(op === 'replace' && firstRow === tbody.rows[0]) ||
				(op === 'update' &&
					oldLabel === tbody.rows[0]?.querySelector('td:nth-child(2) a')?.textContent) ||
				(op === 'swap' && secondRow !== tbody.rows[998]) ||
				(op === 'remove' && removedRow?.isConnected) ||
				((op === 'select' || op === 'select_lots') &&
					!el.closest('tr')?.classList.contains('danger'))
			) {
				throw new Error(`${op}: the expected DOM change was not committed inside the timed click`);
			}
			return elapsed;
		},
		{ op: op.name, selector },
	);
}
