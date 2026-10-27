import { expect, test } from 'vitest';
import { waitFor, fireEvent } from '../harness.js';
import { start as solid } from '../fixtures/solid-reference/dist/index.js';
import { start as ripple } from '../fixtures/ripple-reference/dist/index.js';

async function run(start) {
	const target = document.createElement('section');
	document.body.append(target);
	const app = start(target);
	const snapshots = [];
	const checkpoint = (label) => snapshots.push({
		label,
		ui: target.textContent.replace(/\s+/g, ' ').trim(),
		location: {
			pathname: app.router.state.location.pathname,
			search: app.router.state.location.search,
		},
		status: app.router.state.status,
		matches: app.router.state.matches.map(
			(m) => ({ id: m.routeId, status: m.status, loaderData: m.loaderData }),
		),
		events: app.events.slice(),
		renders: app.renders.slice(),
		loaders: app.loaders.slice(),
		listeners: app.listeners(),
	});
	try {
		await waitFor(() => expect(app.router.state.status).toBe('idle'));
		await waitFor(() => expect(target.textContent).toContain('A 1'));
		checkpoint('initial');
		fireEvent.click(target.querySelector('button'));
		await waitFor(() => expect(target.textContent).toContain('Count 1'));
		await app.router.navigate({ to: '/a', search: { version: 2 } });
		checkpoint('same-route');
		const pending = app.router.navigate({ to: '/b' });
		await waitFor(() => expect(app.loaders).toContain('b:start'));
		checkpoint('pending-retains-parent');
		await app.router.navigate({ to: '/c' });
		checkpoint('superseded');
		app.gate.resolve();
		await pending;
		await Promise.resolve();
		checkpoint('late-completion');
		expect(target.textContent).toBe('Count 1C');
		expect(app.renders).not.toContain('/b');
		await app.router.invalidate();
		checkpoint('invalidation');
		app.dispose();
		expect(app.listeners()).toBe(0);
		expect(target.textContent).toBe('');
		const rendered = app.renders.slice();
		app.router.history.push('/a?version=3');
		await Promise.resolve();
		expect(app.renders).toEqual(rendered);
		checkpoint('disposed');
		return snapshots;
	} finally {
		app.gate.resolve();
		app.dispose();
		app.router.history.destroy();
		target.remove();
	}
}

test(
	'isolated Solid and Ripple apps agree on state, events, retained UI and cleanup',
	async () => {
		const expected = await run(solid);
		const actual = await run(ripple);
		expect(actual).toEqual(expected);
	},
	15000,
);
