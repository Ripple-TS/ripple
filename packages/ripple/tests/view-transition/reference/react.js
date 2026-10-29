// Independently authored reference, pinned to React 19.3.0. No upstream test
// implementation is copied; provenance is recorded in ../README.md.
import {
	createElement as h,
	ViewTransition,
	startTransition,
	useState,
	Suspense,
	use,
} from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';

export const events = [];
export const cleanups = [];
let update;
const event = (kind) => (instance) => {
	events.push({ kind, name: instance.name });
	return () => cleanups.push(kind);
};
function App() {
	const [state, setState] = useState({ count: 0, shown: true, detail: false });
	update = (action) =>
		setState((state) =>
			action === 'share'
				? { ...state, detail: !state.detail }
				: action === 'exit'
					? { ...state, shown: false }
					: action === 'enter'
						? { ...state, shown: true }
						: { ...state, count: state.count + 1 },
		);
	return h(
		'main',
		null,
		h(
			ViewTransition,
			{ name: 'counter', onUpdate: event('update') },
			h(
				'section',
				null,
				h('input', { id: 'focus', defaultValue: 'editable' }),
				h('output', null, state.count),
			),
		),
		state.shown &&
			h(
				ViewTransition,
				{ name: 'notice', onEnter: event('enter'), onExit: event('exit') },
				h('p', { id: 'notice' }, 'Saved'),
			),
		state.detail
			? h(
					'article',
					null,
					h(
						ViewTransition,
						{ name: 'photo', onShare: event('share') },
						h('h2', { id: 'photo' }, 'detail'),
					),
				)
			: h(
					'aside',
					null,
					h(
						ViewTransition,
						{ name: 'photo', onShare: event('share') },
						h('h3', { id: 'photo' }, 'thumbnail'),
					),
				),
	);
}
export function run(action) {
	startTransition(() => update(action));
}
const root = createRoot(document.getElementById('app'));
const pending = Promise.withResolvers();
function AsyncContent() {
	return h('p', { id: 'async-result' }, use(pending.promise));
}
function AsyncApp() {
	return h(
		ViewTransition,
		{ name: 'async-content', onUpdate: event('reveal') },
		h(Suspense, { fallback: h('p', { id: 'skeleton' }, 'loading') }, h(AsyncContent)),
	);
}
flushSync(() => root.render(h(location.pathname === '/reference-async' ? AsyncApp : App)));
window.reactReference = {
	run,
	events,
	cleanups,
	resolveAsync: () => pending.resolve('loaded content'),
};
