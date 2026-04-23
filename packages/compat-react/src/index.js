/** @import { Tsx } from '../types' */
/** @import { ReactNode } from 'react' */
/** @import { Block, BlockWithTryBoundary, TryBoundaryState } from 'ripple/internal/client-types' */

import { jsx, jsxs, Fragment } from 'react/jsx-runtime';
import {
	useSyncExternalStore,
	useLayoutEffect,
	useEffect,
	useRef,
	useState,
	Component,
	Suspense,
	use,
} from 'react';
import { createPortal } from 'react-dom';
import { createRoot } from 'react-dom/client';
import {
	branch,
	with_block,
	proxy_props,
	set,
	render,
	tracked,
	get_tracked,
	handle_error,
	get_pending_boundary,
	TRY_BLOCK,
	destroy_block,
	root,
	init_operations,
	resume_block,
	is_destroyed,
	queue_post_block_flush_callback,
	schedule_update,
} from 'ripple/internal/client';
import { Context } from 'ripple';

/** @type {Tsx} */
const tsx = {
	jsx,
	jsxs,
	Fragment,
};

/** @type {Context<null | { portals: Map<any, any>, update: Function}>} */
const PortalContext = new Context(null);

/**
 * @param {any[] | Map<any, any>} portals
 */
function map_portals(portals) {
	return Array.from(portals.entries()).map(([el, { component, key }], i) => {
		return createPortal(jsx(component, {}, key), el);
	});
}

/**
 * @param {Block} block
 * @returns {boolean}
 */
function is_inside_try_pending(block) {
	/** @type {Block | null} */
	let current = block;

	while (current) {
		if (current.f & TRY_BLOCK && /** @type {BlockWithTryBoundary} */ (current).s.p) {
			return true;
		}
		current = current.p;
	}
	return false;
}

/**
 * @param {ReturnType<typeof createReactCompat>} compat
 * @param {{ from: string, factory: string }} metadata
 * @returns {ReturnType<typeof createReactCompat> & { __ripple_compat__: { from: string, factory: string } }}
 */
function with_compat_metadata(compat, metadata) {
	return Object.assign(compat, {
		__ripple_compat__: metadata,
	});
}

/**
 * @param {typeof createReactCompat} factory
 * @param {{ from: string, factory: string }} metadata
 * @returns {(() => ReturnType<typeof createReactCompat> & { __ripple_compat__: { from: string, factory: string } }) & { __ripple_compat__: { from: string, factory: string } }}
 */
function create_compat_entry(factory, metadata) {
	return Object.assign(() => with_compat_metadata(factory(), metadata), {
		__ripple_compat__: metadata,
	});
}

export function createReactCompat() {
	const root_portals = new Map();
	/** @type {{ portals: Map<any, any>, update: Function}} */
	const root_portal_state = { portals: root_portals, update: () => {} };

	return {
		/**
		 * @param {HTMLElement} node
		 * @param {(tsx: Tsx) => ReactNode} children_fn
		 */
		createComponent(node, children_fn) {
			const target_element = document.createElement('span');
			target_element.style.display = 'contents';
			node.before(target_element);

			/** @type {(() => void) | undefined} */
			let trigger;
			/** @type {(() => void) | undefined} */
			let teardown;
			/** @type {ReactNode} */
			let react_node;

			const e = render(() => {
				react_node = children_fn(tsx);
				trigger?.();
			});
			target_element.__ripple_block = e;

			/**
			 * @param {() => void} callback
			 */
			function subscribe(callback) {
				trigger = callback;

				return () => {
					teardown?.();
				};
			}

			const use_suspense = is_inside_try_pending(e);

			function ReactCompat() {
				return useSyncExternalStore(subscribe, () => react_node);
			}

			function SuspenseHandler() {
				useLayoutEffect(() => {
					const boundary = get_pending_boundary(e);
					if (boundary === null) return;
					const request_id = boundary.s.b();
					return () => {
						boundary.s.r(request_id);
					};
				}, []);

				return null;
			}

			class ReactCompatBoundary extends Component {
				state = { e: false };

				static getDerivedStateFromError() {
					return { e: true };
				}

				/**
				 * @param {unknown} error
				 */
				componentDidCatch(error) {
					handle_error(error, e);
				}

				render() {
					if (this.state?.e) {
						return null;
					}
					if (use_suspense) {
						return jsx(Suspense, {
							fallback: jsx(SuspenseHandler, {}),
							children: jsx(ReactCompat, {}),
						});
					}
					return jsx(ReactCompat, {});
				}
			}

			const key = Math.random().toString(36).substring(2, 9);
			const { portals, update } = PortalContext.get() || root_portal_state;
			portals.set(target_element, { component: ReactCompatBoundary, key });
			update();
		},

		createRoot() {
			const root_element = document.createElement('span');

			function CompatRoot() {
				const [, root_update] = useState(0);
				root_portal_state.update = root_update;

				return map_portals(root_portals);
			}

			const root = createRoot(root_element);
			root.render(jsx(CompatRoot, {}));

			return () => {
				root.unmount();
			};
		},
	};
}

export const reactCompat = create_compat_entry(createReactCompat, {
	from: '@ripple-ts/compat-react',
	factory: 'createReactCompat',
});

/**
 * @param {HTMLSpanElement} node
 */
function get_block_from_dom(node) {
	/** @type {null | ParentNode} */
	let current = node;
	while (current) {
		const b = /** @type {Element} */ (current).__ripple_block;
		if (b) {
			return b;
		}
		current = current.parentNode;
	}
	return null;
}

/**
 * @template P
 * @param {{ component: (anchor: Node, props: any) => void; props?: P }} props
 * @returns {React.JSX.Element}
 */
export function Ripple({ component, props }) {
	const ref = useRef(null);
	const tracked_props_ref = useRef(/** @type {any} */ (null));
	const suspense_ref = useRef(/** @type {any} */ (null));
	const portals_ref = /** @type {React.MutableRefObject<Map<any, any> | null>} */ (useRef(null));
	const [, update] = useState(0);

	if (portals_ref.current === null) {
		portals_ref.current = new Map();
	}
	const portals = portals_ref.current;

	if (suspense_ref.current !== null) {
		use(suspense_ref.current);
	}

	useEffect(() => {
		const span = /** @type {HTMLSpanElement | null} */ (ref.current);
		if (span === null) {
			return;
		}
		const frag = document.createDocumentFragment();
		const anchor = document.createTextNode('');
		const block = get_block_from_dom(span);

		if (block === null) {
			throw new Error(
				'Ripple component must be rendered inside a Ripple root. If you are using Ripple inside a React app, ensure your React root contains <RippleRoot>.',
			);
		}
		const tracked_props = (tracked_props_ref.current = tracked(props || {}, block));
		const proxied_props = proxy_props(() => get_tracked(tracked_props));
		frag.append(anchor);

		/** @type {Block} */
		const b = with_block(block, () => {
			PortalContext.set({ portals, update });

			let pending_count = 0;
			let request_version = 0;
			let has_resolved = false;
			/** @type {Set<number>} */
			const active_requests = new Set();
			/** @type {((value?: unknown) => void) | null} */
			let resolve_fn = null;
			/** @type {Map<number, (reason: any) => void>} */
			const pending_deferreds = new Map();
			/** @type {Set<Block>} */
			let paused_blocks = new Set();
			/** @type {Block | null} */
			let boundary_block = null;

			function resume_paused_blocks() {
				if (paused_blocks.size === 0) {
					return;
				}

				const blocks = paused_blocks;
				paused_blocks = new Set();

				for (const block of blocks) {
					if (!is_destroyed(block)) {
						resume_block(block);
					}
				}
			}

			function begin_request() {
				const request_id = ++request_version;
				active_requests.add(request_id);
				pending_count++;

				// Only suspend via React on the initial load. After the first
				// resolution, subsequent async requests keep the existing
				// resolved content visible (stale-while-revalidate).
				if (suspense_ref.current === null && !has_resolved) {
					const promise = new Promise((_resolve) => {
						resolve_fn = _resolve;
					});
					suspense_ref.current = promise;
					update((x) => x + 1);
				}

				return request_id;
			}

			/**
			 * @param {number} old_request_id
			 * @returns {number}
			 */
			function replace_request(old_request_id) {
				active_requests.delete(old_request_id);
				pending_deferreds.delete(old_request_id);
				// pending_count unchanged — one out, one in
				const request_id = ++request_version;
				active_requests.add(request_id);
				return request_id;
			}

			/**
			 * @param {number} request_id
			 * @param {boolean} [render_resolved_branch=true]
			 * @returns {boolean}
			 */
			function complete_request(request_id, render_resolved_branch = true) {
				if (!active_requests.delete(request_id)) {
					return false;
				}

				pending_deferreds.delete(request_id);
				pending_count--;

				if (pending_count === 0) {
					if (!render_resolved_branch) {
						paused_blocks.clear();
						return true;
					}

					resume_paused_blocks();

					// Schedule the boundary block for update so that child blocks
					// (e.g. render blocks using trackPending) get re-checked during
					// the flush and re-run if their dependencies are dirty.
					if (boundary_block !== null && !is_destroyed(boundary_block)) {
						schedule_update(boundary_block);
					}

					queue_post_block_flush_callback(() => {
						if (pending_count > 0) {
							return;
						}

						has_resolved = true;

						if (resolve_fn !== null) {
							resolve_fn();
							resolve_fn = null;
						}
						suspense_ref.current = null;
					});
				}

				return true;
			}

			/** @type {TryBoundaryState} */
			const state = {
				p: true,
				b: begin_request,
				r: complete_request,
				c: (error) => {
					pending_count = 0;
					active_requests.clear();

					if (pending_deferreds.size > 0) {
						for (var [, reject_fn] of pending_deferreds) {
							reject_fn(error);
						}
						pending_deferreds.clear();
					}

					paused_blocks.clear();

					// Resolve React Suspense promise to prevent it from hanging
					has_resolved = true;
					if (resolve_fn !== null) {
						resolve_fn();
						resolve_fn = null;
					}
					suspense_ref.current = null;

					// Propagate the error to the next catch boundary up the tree
					if (boundary_block !== null && boundary_block.p !== null) {
						handle_error(error, boundary_block.p);
					}
				},
				/** @param {number} request_id @param {(reason: any) => void} reject_fn */
				rd: (request_id, reject_fn) => {
					pending_deferreds.set(request_id, reject_fn);
				},
				/** @param {Block} block */
				pb: (block) => {
					paused_blocks.add(block);
				},
				rp: replace_request,
			};

			boundary_block = branch(
				() => {
					component(anchor, proxied_props);
				},
				TRY_BLOCK,
				state,
			);

			return boundary_block;
		});

		span.append(frag);

		return () => {
			anchor.remove();
			destroy_block(b);
		};
	}, [component]);

	useEffect(() => {
		set(/** @type {any} */ (tracked_props_ref.current), props || {});
	}, [props]);

	return jsx(Fragment, {
		children: [
			jsx('span', { ref, style: { display: 'contents' } }, 'target'),
			...map_portals(portals),
		],
	});
}

/**
 * @param {{ children: React.ReactNode }} props
 */
export function RippleRoot({ children }) {
	const ref = useRef(null);

	useLayoutEffect(() => {
		const target_element = /** @type {HTMLSpanElement | null} */ (ref.current);
		if (target_element === null) {
			return;
		}
		init_operations();
		const e = root(() => {});
		// @ts-ignore
		target_element.__ripple_block = e;
	}, []);

	return jsx('span', { ref, style: { display: 'contents' }, children });
}
