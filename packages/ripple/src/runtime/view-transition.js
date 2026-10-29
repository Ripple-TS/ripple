import { valid_name, resolve_class, scope_class } from './view-transition-style.js';
/** @import { Block, TryState } from '#client' */
/** @import { ViewTransitionProps, ViewTransitionClass, ViewTransitionCallback, ViewTransitionInstance, ViewTransitionHandle } from '#public' */
import { DEV } from 'esm-env';
import { branch, get_first_node, is_destroyed } from './internal/client/blocks.js';
import {
	BRANCH_BLOCK,
	IF_BLOCK,
	COMPOSITE_BLOCK,
	TRY_BLOCK,
	DETACHED_BLOCK,
} from './internal/client/constants.js';
import { activity_hidden, activity_revealing } from './internal/client/activity-state.js';
import {
	active_block,
	get,
	untrack,
	with_block,
	flush_sync,
	queue_microtask,
	handle_error,
} from './internal/client/runtime.js';
import { render_value } from './internal/client/expression.js';
import { tsrx_element } from './element.js';
import { createRenderObserver } from './render-observer.js';
import { HYDRATION } from 'ripple/internal/client/hydration-enabled';
import { hydrating } from './internal/client/hydration.js';
import { set_reveal_transition } from './internal/client/try.js';

/** @typedef {{ b: Block, p: ViewTransitionProps, n: number, c: Set<() => void> | null, h: boolean }} Boundary */
/** @typedef {'enter' | 'exit' | 'update' | 'share'} Kind */
/** @typedef {{ b: Boundary, n: string, e: HTMLElement[], r: DOMRect[], p: ViewTransitionProps, v: boolean, i?: number[] }} Snapshot */
/** @type {Map<Block, Boundary>} */
var boundaries = new Map();
/** @type {WeakMap<Block, import('#public').ViewTransitionController>} */
var automatic = new WeakMap();
/** @type {WeakSet<Window>} */
var listening = new WeakSet();
/** @typedef {{ s: () => void, t: globalThis.ViewTransition | null, u: number, q: Array<() => void> | null }} TransitionOwner */
/** @type {WeakMap<Document, TransitionOwner>} */
var current = new WeakMap();
var id = 0;
const name_property = 'view-transition-name';
const class_property = 'view-transition-class';

/** @param {ViewTransitionProps} props */
export function ViewTransition(props) {
	return tsrx_element(render_boundary, props);
}

/** @param {ChildNode} anchor @param {Block} _block @param {ViewTransitionProps} props */
function render_boundary(anchor, _block, props) {
	if (props.name !== undefined) {
		var doc = anchor.ownerDocument ?? /** @type {any} */ (anchor).parent?.ownerDocument ?? document;
		var win = doc.defaultView;
		if (win && !listening.has(win)) {
			listening.add(win);
			win.addEventListener('pageswap', prepare_document_transition);
			win.addEventListener('pagereveal', prepare_document_transition);
		}
	}
	branch(() => {
		/** @type {Boundary} */
		var boundary = {
			b: /** @type {Block} */ (active_block),
			p: props,
			n: ++id,
			c: null,
			h: HYDRATION && hydrating && !activity_revealing,
		};
		if (boundaries.size === 0) set_reveal_transition(transition_reveal);
		boundaries.set(boundary.b, boundary);
		// The child template already owns its DOM range. No additional anchor,
		// wrapper, hydration marker, or per-element field is needed.
		try {
			render_value(props.children, anchor, active_block);
		} catch (error) {
			unregister(boundary);
			throw error;
		}
		return () => {
			unregister(boundary);
			if (boundary.c !== null) for (var cleanup of boundary.c) cleanup();
		};
	});
}

/** Refresh explicit names at the browser's cross-document snapshot boundary.
 * SSR supplies incoming names even when this module has not hydrated yet.
 * @param {Event & { viewTransition?: globalThis.ViewTransition | null }} event
 */
function prepare_document_transition(event) {
	var transition = event.viewTransition;
	if (!transition) return;
	var doc = /** @type {Window} */ (event.currentTarget).document;
	current.get(doc)?.s();
	/** @type {Array<() => void>} */
	var restore = [];
	try {
		for (var snapshot of capture(doc, true)) {
			var value = styling(snapshot, 'share', [...(transition.types ?? [])]);
			if (value === 'none') {
				for (var element of snapshot.e) restore.push(set_style(element, name_property, 'none'));
			} else apply(snapshot, value, restore);
		}
	} catch (error) {
		drain(restore);
		transition.skipTransition();
		throw error;
	}
	var release = () => drain(restore);
	(event.type === 'pageswap' ? transition.finished : transition.ready).then(release, release);
}

/** @param {Boundary} boundary */
function unregister(boundary) {
	boundaries.delete(boundary.b);
	if (boundaries.size === 0) set_reveal_transition(null);
}

/** @param {TryState} state @param {() => void} reveal */
function transition_reveal(state, reveal) {
	if (
		(HYDRATION && hydrating) ||
		state.si !== null ||
		!state.a.isConnected ||
		activity_hidden(state.b)
	)
		return false;
	var doc = state.a.ownerDocument;
	if (
		!doc ||
		typeof doc.startViewTransition !== 'function' ||
		doc.defaultView?.matchMedia?.('(prefers-reduced-motion: reduce)').matches
	)
		return false;
	/** @type {Boundary | undefined} */
	var boundary;
	for (var block = state.b; block !== null; block = block.p) {
		boundary = boundaries.get(block);
		if (boundary) break;
	}
	if (!boundary) return false;
	var entry = current.get(doc);
	if (doc.activeViewTransition && doc.activeViewTransition !== entry?.t) return false;
	if (!entry || entry.u === 2) {
		var controller = automatic.get(boundary.b);
		if (!controller) {
			// Allocate observation/lifetime state on the first reveal, never as
			// extra work for every mounted or hydrated animation boundary.
			controller = /** @type {import('#public').ViewTransitionController} */ (
				with_block(boundary.b, createViewTransition)
			);
			automatic.set(boundary.b, controller);
		}
		var owner = boundary.b;
		controller
			.run(() => {})
			.finished.catch((error) => {
				queue_microtask(() => {
					if (!is_destroyed(owner)) handle_error(error, owner);
				});
			});
		entry = current.get(doc);
	}
	if (!entry) return false;
	if (entry.u === 0) (entry.q ??= []).push(reveal);
	else reveal();
	return true;
}

/** @param {TransitionOwner} entry */
function reveal_queued(entry) {
	var queue = entry.q;
	entry.q = null;
	if (queue !== null) for (var reveal of queue) reveal();
}

/** Collect connected element roots. A pending try keeps its resolved branch
 * offscreen, so the first node in its block tree may not be the visible branch.
 * @param {Block} block @param {Document} doc @param {HTMLElement[]} elements @param {boolean} navigation
 */
function collect_elements(block, doc, elements, navigation) {
	if ((block.f & DETACHED_BLOCK) !== 0) return;
	if (
		(block.f & (BRANCH_BLOCK | IF_BLOCK | COMPOSITE_BLOCK)) !== 0 &&
		(block.f & TRY_BLOCK) === 0 &&
		block.s?.start != null
	) {
		for (var node = block.s.start; node !== null; node = node.nextSibling) {
			if (
				node.nodeType === 1 &&
				node.isConnected &&
				node.ownerDocument === doc &&
				'style' in node &&
				(navigation
					? !/^(SCRIPT|STYLE|LINK|META|TITLE|TEMPLATE|HEAD|NOSCRIPT)$/.test(node.tagName)
					: node.getClientRects().length !== 0)
			)
				elements.push(node);
			if (node === block.s.end) break;
		}
		return;
	}
	for (var child = block.first; child !== null; child = child.next)
		collect_elements(child, doc, elements, navigation);
}

/** @param {string} message */
function diagnostic(message) {
	if (DEV) console.warn('ViewTransition: ' + message);
}

/** @param {Document} doc @param {boolean} [navigation] @returns {Snapshot[]} */
function capture(doc, navigation = false) {
	/** @type {Snapshot[]} */
	var snapshots = [];
	/** @type {Map<Element, Snapshot>} */
	var owners = new Map();
	for (var boundary of boundaries.values()) {
		if (is_destroyed(boundary.b) || activity_hidden(boundary.b)) continue;
		/** @type {HTMLElement[]} */
		var elements = [];
		collect_elements(boundary.b, doc, elements, navigation);
		if (
			elements.length === 0 ||
			(navigation && !elements.some((element) => element.getClientRects().length !== 0))
		)
			continue;
		var props = boundary.p;
		var name = untrack(() => get(/** @type {any} */ (props.name)));
		if (navigation && name === undefined) continue;
		if (name !== undefined && !valid_name(name)) {
			diagnostic('Invalid or reserved name "' + name + '". Use a CSS identifier.');
			continue;
		}
		/** @type {Snapshot} */
		var snapshot = {
			b: boundary,
			n: name ?? 'ripple-vt-' + boundary.n,
			e: elements,
			r: [],
			p: { ...props },
			v: false,
		};
		for (var kind of /** @type {const} */ (['default', 'enter', 'exit', 'update', 'share'])) {
			snapshot.p[kind] = untrack(() => get(/** @type {any} */ (props[kind])));
		}
		// Nested boundaries on the same host give the innermost one ownership.
		for (var element of elements) owners.set(element, snapshot);
		snapshots.push(snapshot);
	}
	var names = new Set();
	var duplicates = new Set();
	for (var snapshot of snapshots) {
		if (navigation)
			snapshot.i = snapshot.e.flatMap((element, index) =>
				owners.get(element) === snapshot ? [index] : [],
			);
		snapshot.e = snapshot.e.filter((element) => owners.get(element) === snapshot);
		if (snapshot.e.length === 0) continue;
		if (names.has(snapshot.n)) duplicates.add(snapshot.n);
		names.add(snapshot.n);
		snapshot.r = snapshot.e.map((element) => element.getBoundingClientRect());
		snapshot.v = snapshot.r.some(
			(rect) =>
				rect.bottom > 0 &&
				rect.right > 0 &&
				rect.top < (doc.defaultView?.innerHeight ?? 0) &&
				rect.left < (doc.defaultView?.innerWidth ?? 0),
		);
	}
	for (var name of duplicates)
		diagnostic('Duplicate name "' + name + '"; these boundaries will not animate.');
	return snapshots.filter((snapshot) => snapshot.e.length !== 0 && !duplicates.has(snapshot.n));
}

/** @param {Snapshot} snapshot @param {Kind} kind @param {readonly string[]} types */
function styling(snapshot, kind, types) {
	return scope_class(
		resolve_class(/** @type {ViewTransitionClass} */ (snapshot.p[kind]), types) ??
			resolve_class(/** @type {ViewTransitionClass} */ (snapshot.p.default), types) ??
			'auto',
		/** @type {ViewTransitionProps & { $v?: string }} */ (snapshot.p).$v,
	);
}

/** @param {Snapshot} snapshot */
function names(snapshot) {
	return snapshot.e.map((_, index) => {
		var suffix = snapshot.i?.[index] ?? index;
		return snapshot.n + (suffix ? '--ripple-' + suffix : '');
	});
}

/** @param {HTMLElement} element @param {string} property @param {string} value */
function set_style(element, property, value) {
	var style = element.style;
	var previous = style.getPropertyValue(property);
	var priority = style.getPropertyPriority(property);
	var had_style = element.hasAttribute('style');
	style.setProperty(property, value, 'important');
	var applied = style.getPropertyValue(property);
	return () => {
		// Preserve application writes made after our temporary assignment.
		if (
			style.getPropertyValue(property) === applied &&
			style.getPropertyPriority(property) === 'important'
		) {
			if (previous) style.setProperty(property, previous, priority);
			else style.removeProperty(property);
			if (!had_style && style.length === 0) element.removeAttribute('style');
		}
	};
}

/** @param {Snapshot} snapshot @param {string} value @param {Array<() => void>} restore */
function apply(snapshot, value, restore) {
	var identifiers = names(snapshot);
	for (var i = 0; i < snapshot.e.length; i++) {
		restore.push(set_style(snapshot.e[i], name_property, identifiers[i]));
		if (value !== 'auto' && value !== 'none')
			restore.push(set_style(snapshot.e[i], class_property, value));
		else if (snapshot.e[i].style.getPropertyValue(class_property))
			restore.push(set_style(snapshot.e[i], class_property, 'none'));
	}
}

/** @param {Array<() => void>} callbacks */
function drain(callbacks) {
	for (var callback of callbacks.splice(0).reverse()) callback();
}

/** @param {Snapshot} snapshot @param {Set<Node>} roots */
function top_level(snapshot, roots) {
	return !snapshot.e.some((element) => {
		for (var parent = element.parentNode; parent !== null; parent = parent.parentNode) {
			if (roots.has(parent)) return true;
		}
		return false;
	});
}

/** @param {Document} doc @param {Snapshot} snapshot @returns {ViewTransitionInstance} */
function instance(doc, snapshot) {
	var identifiers = names(snapshot);
	/** @param {string} kind */
	var pseudo = (kind) => {
		var selectors = identifiers.map((name) => '::view-transition-' + kind + '(' + name + ')');
		return {
			/** @param {Keyframe[] | PropertyIndexedKeyframes | null} keyframes @param {number | KeyframeAnimationOptions} [options] */
			animate(keyframes, options) {
				return selectors.map((pseudoElement) =>
					doc.documentElement.animate(keyframes, {
						...(typeof options === 'number' ? { duration: options } : options),
						pseudoElement,
					}),
				);
			},
			getAnimations() {
				return doc.documentElement
					.getAnimations({ subtree: true })
					.filter((animation) =>
						selectors.includes(
							/** @type {KeyframeEffect | null} */ (animation.effect)?.pseudoElement ?? '',
						),
					);
			},
		};
	};
	return {
		name: snapshot.n,
		names: identifiers,
		old: pseudo('old'),
		new: pseudo('new'),
		group: pseudo('group'),
		imagePair: pseudo('image-pair'),
	};
}

/** @param {Document} doc @param {Snapshot[]} snapshots */
function assets_ready(doc, snapshots) {
	/** @type {Promise<unknown>[]} */
	var pending = [];
	if (doc.fonts?.status === 'loading') pending.push(doc.fonts.ready);
	for (var snapshot of snapshots) {
		for (var element of snapshot.e) {
			for (var image of /** @type {HTMLImageElement[]} */ ([
				...(element.tagName === 'IMG' ? [element] : []),
				...element.querySelectorAll('img'),
			])) {
				if (!image.complete && image.decode) pending.push(image.decode().catch(() => {}));
			}
		}
	}
	// Stylesheets loaded by the application should be awaited by its updater.
	// Blocking on unrelated document resources would strand otherwise ready UI.
	return pending.length === 0 ? null : Promise.all(pending);
}

/** @param {Promise<unknown>} promise @param {AbortSignal} signal */
function wait(promise, signal) {
	return new Promise((resolve, reject) => {
		var abort = () => resolve(undefined);
		if (signal.aborted) return abort();
		signal.addEventListener('abort', abort, { once: true });
		promise.then(resolve, reject).finally(() => signal.removeEventListener('abort', abort));
	});
}

/** @returns {import('#public').ViewTransitionController} */
export function createViewTransition() {
	var observer = createRenderObserver();
	var owner = /** @type {Block} */ (active_block);
	var disposed = false;
	/** @type {null | (() => void)} */
	var cancel = null;
	var dispose = () => {
		disposed = true;
		cancel?.();
		observer.dispose();
	};
	branch(() => dispose);
	return {
		dispose,
		run(update, options = {}) {
			if (disposed || is_destroyed(owner)) {
				return {
					rendered: Promise.resolve(false),
					ready: Promise.resolve(false),
					finished: Promise.resolve(),
					skipTransition() {},
				};
			}
			var doc = get_first_node(owner)?.ownerDocument ?? document;
			var previous = current.get(doc);
			var external = doc.activeViewTransition && doc.activeViewTransition !== previous?.t;
			cancel?.();
			previous?.s();
			var types = [...new Set(options.types ?? [])];
			var abort = new AbortController();
			var rendered = /** @type {PromiseWithResolvers<boolean>} */ (Promise.withResolvers());
			var ready = /** @type {PromiseWithResolvers<boolean>} */ (Promise.withResolvers());
			var finished = /** @type {PromiseWithResolvers<void>} */ (Promise.withResolvers());
			/** @type {globalThis.ViewTransition | null} */
			var native = null;
			var skipped = false;
			var done = false;
			/** @type {unknown} */
			var failure;
			var failed = false;
			/** @param {unknown} error */
			function fail(error) {
				if (!failed) {
					failed = true;
					failure = error;
				}
			}
			/** @type {Array<() => void>} */
			var restore = [];
			/** @type {Array<() => void>} */
			var cleanups = [];
			/** @type {Array<[Snapshot, Kind]>} */
			var events = [];
			/** @type {HTMLStyleElement | null} */
			var sheet = null;
			/** @type {MutationObserver | null} */
			var mutations = null;
			/** @type {MutationRecord[]} */
			var records = [];
			var timer = setTimeout(() => stop(), Math.max(0, options.timeout ?? 500));
			function cleanup() {
				if (done) return;
				done = true;
				abort.abort();
				clearTimeout(timer);
				mutations?.disconnect();
				drain(restore);
				sheet?.remove();
				// Reveals are renderer work, not disposable animation work. A skip,
				// timeout, or superseding run must never strand the pending branch.
				entry.u = 1;
				if (entry.q !== null) {
					try {
						flush_sync(() => reveal_queued(entry));
					} catch (error) {
						fail(error);
					}
				}
				for (var callback of cleanups.splice(0)) {
					try {
						callback();
					} catch (error) {
						fail(error);
					}
				}
				if (current.get(doc) === entry) current.delete(doc);
				if (cancel === stop) cancel = null;
				before = [];
				events = [];
				records = [];
				native = null;
				entry.t = null;
				mutations = null;
				sheet = null;
				ready.resolve(false);
				if (failed) finished.reject(failure);
				else finished.resolve();
			}
			function skip() {
				skipped = true;
				native?.skipTransition();
				ready.resolve(false);
			}
			function stop() {
				abort.abort();
				rendered.resolve(false);
				skip();
				cleanup();
			}
			cancel = stop;
			/** @type {TransitionOwner} */
			var entry = { s: stop, t: null, u: 0, q: null };
			current.set(doc, entry);
			/** @type {ViewTransitionHandle} */
			var handle = {
				rendered: rendered.promise,
				ready: ready.promise,
				finished: finished.promise,
				skipTransition: skip,
			};
			// Callers can fire and forget without unhandled rejection noise, while
			// explicitly awaiting a failed handle still rejects.
			rendered.promise.catch(() => {});
			finished.promise.catch(() => {});
			var animate =
				typeof doc.startViewTransition === 'function' &&
				!doc.defaultView?.matchMedia?.('(prefers-reduced-motion: reduce)').matches &&
				!external;
			// Pre-existing hydrated boundaries may participate in later updates.
			// Boundaries adopted during this run must not animate an initial enter.
			for (var boundary of boundaries.values()) boundary.h = false;
			/** @type {Snapshot[]} */
			var before = [];
			try {
				if (animate) {
					before = capture(doc);
					restore.push(set_style(doc.documentElement, name_property, 'none'));
					for (var snapshot of before) apply(snapshot, styling(snapshot, 'exit', types), restore);
				}
			} catch (error) {
				fail(error);
				drain(restore);
				animate = false;
			}
			async function commit() {
				if (abort.signal.aborted) return;
				// The browser has captured the old state. Restore before application
				// writes, then observe only this commit, including refs and effects.
				drain(restore);
				if (animate && !skipped) {
					mutations = new MutationObserver((changes) => records.push(...changes));
					mutations.observe(doc.documentElement, {
						subtree: true,
						attributes: true,
						characterData: true,
						childList: true,
					});
				}
				entry.u = 1;
				try {
					/** @type {void | Promise<void>} */
					var result = undefined;
					var observation = observer.run(
						() => {
							result = update();
						},
						{ signal: abort.signal },
					);
					if (entry.q !== null) {
						const revealed = observer.run(() => reveal_queued(entry), { signal: abort.signal });
						// A new observation supersedes the previous boolean result, but
						// must not discard an updater/render failure from that first run.
						observation = Promise.all([observation, revealed]).then(([, complete]) => complete);
					}
					var pending = /** @type {void | Promise<void>} */ (result);
					if (pending && typeof pending.then === 'function') {
						await wait(Promise.all([pending, observation]), abort.signal);
						if (abort.signal.aborted) return;
						observation = observer.run(() => {}, { signal: abort.signal });
					}
					var complete = await observation;
					rendered.resolve(complete);
					if (!complete || skipped || abort.signal.aborted) {
						skip();
						return;
					}
					if (!animate) return;
					var after = capture(doc);
					var assets = assets_ready(doc, after);
					if (assets !== null) {
						await wait(assets, abort.signal);
						if (abort.signal.aborted) return;
						// Asset layout can change without a DOM mutation. Already-ready
						// content needs neither another microtask nor another layout read.
						after = capture(doc);
					}
					records.push(...(mutations?.takeRecords() ?? []));
					mutations?.disconnect();
					var selected = select(before, after, records);
					var disabled_shared = new Set(
						selected
							.filter(
								([snapshot, kind]) => kind === 'share' && styling(snapshot, kind, types) === 'none',
							)
							.map(([snapshot]) => snapshot.n),
					);
					var active_names = new Set();
					var active_boundaries = new Set();
					restore.push(set_style(doc.documentElement, name_property, 'none'));
					for (var [snapshot, kind] of selected) {
						var value = styling(snapshot, kind, types);
						if (value === 'none' || (kind === 'share' && disabled_shared.has(snapshot.n))) continue;
						// React 19.3 notifies the outgoing shared owner. The incoming
						// side supplies the new snapshot's styles, not a second event.
						if (kind !== 'share' || !after.includes(snapshot)) events.push([snapshot, kind]);
						for (var name of names(snapshot)) active_names.add(name);
						if (after.includes(snapshot)) {
							active_boundaries.add(snapshot.b);
							apply(snapshot, value, restore);
						}
					}
					// Persistent SSR names serve full-page navigation. Exclude idle
					// boundaries from this local snapshot, then restore their names.
					for (var snapshot of after) {
						if (!active_boundaries.has(snapshot.b)) {
							for (var element of snapshot.e) {
								if (element.style.getPropertyValue(name_property))
									restore.push(set_style(element, name_property, 'none'));
							}
						}
					}
					// Ripple mutates in place, so exits/unchanged boundaries cannot be
					// predicted before the old snapshot. Hide their unused old groups;
					// surviving unselected nodes are live (not captured in the new state).
					var unused = before.flatMap(names).filter((name) => !active_names.has(name));
					if (unused.length) {
						sheet = doc.createElement('style');
						sheet.textContent = unused
							.map((name) => '::view-transition-group(' + name + '){display:none!important}')
							.join('');
						doc.head.appendChild(sheet);
					}
					if (events.length === 0) skip();
				} catch (error) {
					fail(error);
					rendered.reject(error);
					skip();
					throw error;
				} finally {
					entry.u = 2;
				}
			}
			if (!animate) {
				void commit().then(cleanup, cleanup);
			} else {
				try {
					// The callback form also works in browsers without transition types.
					native = entry.t = doc.startViewTransition(commit);
					try {
						for (var type of types) native.types?.add(type);
					} catch {
						// Invalid native types must never cause the updater to run twice.
						skip();
					}
					void native.ready.then(
						() => {
							clearTimeout(timer);
							drain(restore);
							if (done || skipped) return;
							try {
								for (var [snapshot, kind] of events) {
									if (done || skipped) break;
									var callback = /** @type {ViewTransitionCallback | undefined} */ (
										snapshot.p[
											/** @type {'onEnter'} */ ('on' + kind[0].toUpperCase() + kind.slice(1))
										]
									);
									const live = !is_destroyed(snapshot.b.b);
									const teardown = callback?.(instance(doc, snapshot), types);
									if (teardown) {
										var once = once_cleanup(snapshot.b, () => {
											try {
												teardown();
											} catch (error) {
												fail(error);
												skip();
												cleanup();
											}
										});
										if (done || (live && is_destroyed(snapshot.b.b))) once();
										else cleanups.push(once);
									}
								}
								ready.resolve(true);
							} catch (error) {
								fail(error);
								skip();
								cleanup();
							}
							// A native skip rejects ready but must still apply its updater.
						},
						() => {
							skipped = true;
							ready.resolve(false);
							drain(restore);
						},
					);
					void native.finished.then(cleanup, (error) => {
						fail(error);
						cleanup();
					});
				} catch (error) {
					// A browser refusing to start must not prevent the state update.
					drain(restore);
					animate = false;
					void commit().then(cleanup, cleanup);
				}
			}
			return handle;
		},
	};
}

/** @param {Boundary} boundary @param {() => void} callback */
function once_cleanup(boundary, callback) {
	var active = true;
	var cleanup = () => {
		if (!active) return;
		active = false;
		boundary.c?.delete(cleanup);
		if (boundary.c?.size === 0) boundary.c = null;
		callback();
	};
	// Exit owners have already been destroyed; their cleanup belongs to the
	// animation. Live owners also release callbacks if removed mid-animation.
	if (!is_destroyed(boundary.b)) (boundary.c ??= new Set()).add(cleanup);
	return cleanup;
}

/** @param {Snapshot[]} before @param {Snapshot[]} after @param {MutationRecord[]} records @returns {Array<[Snapshot, Kind]>} */
function select(before, after, records) {
	/** @type {Array<[Snapshot, Kind]>} */
	var events = [];
	var old = new Map(before.map((snapshot) => [snapshot.b, snapshot]));
	var next = new Map(after.map((snapshot) => [snapshot.b, snapshot]));
	var exiting = before.filter((snapshot) => !next.has(snapshot.b));
	var entering = after.filter((snapshot) => !old.has(snapshot.b));
	// Build ancestor membership once, avoiding pairwise boundary comparisons
	// when a large list enters or exits in one commit.
	var removed = new Set([
		...exiting.flatMap((snapshot) => snapshot.e),
		...records.flatMap((record) => [...record.removedNodes]),
	]);
	var added = new Set([
		...entering.flatMap((snapshot) => snapshot.e),
		...records.flatMap((record) => [...record.addedNodes]),
	]);
	var shared = new Map(
		entering.filter((snapshot) => snapshot.v).map((snapshot) => [snapshot.n, snapshot]),
	);
	var paired = new Set();
	for (var snapshot of exiting) {
		var match = snapshot.v ? shared.get(snapshot.n) : undefined;
		if (match) {
			events.push([snapshot, 'share'], [match, 'share']);
			paired.add(match);
		} else if (top_level(snapshot, removed)) events.push([snapshot, 'exit']);
	}
	for (var snapshot of entering) {
		if (!snapshot.b.h && !paired.has(snapshot) && top_level(snapshot, added))
			events.push([snapshot, 'enter']);
	}
	var owners = new Map(
		[...before, ...after].flatMap((snapshot) =>
			snapshot.e.map((element) => /** @type {const} */ ([element, snapshot.b])),
		),
	);
	var changed = new Set();
	for (var record of records) {
		// Changes entirely owned by nested boundaries don't activate a parent.
		if (
			record.type === 'childList' &&
			[...record.addedNodes, ...record.removedNodes].every((node) =>
				owners.has(/** @type {HTMLElement} */ (node)),
			)
		)
			continue;
		for (var node = record.target; node !== null; node = /** @type {Node} */ (node.parentNode)) {
			var boundary = owners.get(/** @type {HTMLElement} */ (node));
			if (boundary) {
				changed.add(boundary);
				break;
			}
		}
	}
	for (var snapshot of after) {
		const previous = old.get(snapshot.b);
		if (!previous) continue;
		if (
			changed.has(snapshot.b) ||
			snapshot.n !== previous.n ||
			snapshot.e.length !== previous.e.length ||
			snapshot.e.some(
				(element, i) =>
					element !== previous.e[i] ||
					['x', 'y', 'width', 'height'].some(
						(key) =>
							snapshot.r[i][/** @type {'x'} */ (key)] !== previous.r[i]?.[/** @type {'x'} */ (key)],
					),
			)
		)
			events.push([snapshot, 'update']);
	}
	return events;
}
