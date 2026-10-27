// Adapted from TanStack/solid-router at da2adec76dbe6c0da6d6a0d5640f7b9388217f45; see NOTICE.
import { createRefKey, effect, track, untrack } from 'ripple';
import {
	_isRouteDeparting,
	deepEqual,
	functionalUpdate,
	getUrlScheme,
	isDangerousProtocol,
	removeTrailingSlash,
} from '@tanstack/router-core';
import { isServer } from '@tanstack/router-core/isServer';
import { useRouter } from './hooks.js';
import { matchContext } from './context.js';
import { resolveInput, resolveInputs } from './inputs.js';

const navigationKeys = [
	'to',
	'from',
	'params',
	'search',
	'hash',
	'state',
	'mask',
	'href',
	'reloadDocument',
	'replace',
	'resetScroll',
	'hashScrollIntoView',
	'startTransition',
	'viewTransition',
	'ignoreBlocker',
	'unsafeRelative',
];
const ownKeys = new Set([
	...navigationKeys,
	'activeOptions',
	'activeProps',
	'inactiveProps',
	'preload',
	'preloadDelay',
	'preloadIntentProximity',
	'disabled',
	'children',
	'render',
	'ref',
]);

/**
 * Reactive host props: spread `props.value` onto the anchor in a template.
 * @param {Record<string, any>} options
 * @returns {import('ripple').Derived<Record<string | symbol, any>>}
 */
export function useLinkProps(options) {
	var router = useRouter();
	var routeId = matchContext.get()?.routeId;
	/** @type {import('@tanstack/router-core').ParsedLocation | undefined} */
	var previousLocation;
	var location = track(() => {
		var next = router.stores.location.get();
		if (previousLocation && _isRouteDeparting(router, routeId, next)) return previousLocation;
		return (previousLocation = next);
	});
	var inputs = track(() => {
		var { ref: _ref, ...props } = options;
		return resolveInputs(props);
	});
	var destination = track(() => {
		/** @type {Record<string, any>} */
		var result = {};
		for (var key of navigationKeys) {
			/** @type {Record<string, any>} */ (result)[key] = resolveInput(options[key]);
		}
		return result;
	});
	var state = track(() => {
		var props = {
			to: resolveInput(options.to),
			disabled: resolveInput(options.disabled),
			activeOptions: resolveInput(options.activeOptions),
		};
		var current = location.value;
		var dest = destination.value;
		dest._fromLocation = current;
		var scheme = typeof props.to === 'string' && getUrlScheme(props.to);
		/** @type {string | undefined} */
		var href;
		var external = false;
		var blocked = false;
		var active = false;
		if (scheme) {
			blocked = !router.protocolAllowlist.has(scheme);
			external = true;
			href = blocked ? undefined : props.to;
		} else {
			var next = untrack(() => router.buildLocation(dest));
			var shown = next.maskedLocation ?? next;
			href = shown.external ? shown.publicHref : router.history.createHref(shown.publicHref) || '/';
			blocked = isDangerousProtocol(href || '', router.protocolAllowlist);
			external = !!getUrlScheme(href || '') || !!shown.external;
			if (!external && !blocked) {
				var activeOptions = props.activeOptions;
				var currentPath = removeTrailingSlash(current.pathname, router.basepath);
				var nextPath = removeTrailingSlash(next.pathname, router.basepath);
				active =
					(activeOptions?.exact
						? currentPath === nextPath
						: currentPath.startsWith(nextPath) &&
							(currentPath.length === nextPath.length || currentPath[nextPath.length] === '/')) &&
					(!(activeOptions?.includeSearch ?? true) ||
						deepEqual(
							current.search,
							next.search,
							!activeOptions?.exact,
							activeOptions?.explicitUndefined,
						)) &&
					(!activeOptions?.includeHash || current.hash === next.hash);
			}
		}
		if (blocked && process.env.NODE_ENV !== 'production')
			console.warn(`Blocked Link with dangerous protocol: ${href ?? props.to}`);
		var disabled = !!props.disabled || blocked;
		return { href: disabled ? undefined : href, external, disabled, active, dest };
	});

	/** @type {ReturnType<typeof setTimeout> | undefined} */
	var timeout;
	var cancelPreload = () => {
		clearTimeout(timeout);
		timeout = undefined;
	};
	var preload = () => {
		var current = state.value;
		return (
			!current.disabled &&
			!current.external &&
			!resolveInput(options.reloadDocument) &&
			(resolveInput(options.preload) ?? router.options.defaultPreload)
		);
	};
	var doPreload = () => {
		if (!preload()) return;
		void router.preloadRoute(/** @type {any} */ (state.value.dest)).catch(console.warn);
	};
	var schedulePreload = () => {
		var delay = inputs.value.preloadDelay ?? router.options.defaultPreloadDelay ?? 0;
		if (!delay) doPreload();
		else
			timeout ??= setTimeout(() => {
				timeout = undefined;
				doPreload();
			}, delay);
	};
	var enqueuePreload = () => {
		if (preload() === 'intent') schedulePreload();
	};
	/** @type {import('ripple').Tracked<Element | null>} */
	var element = track(null);
	var elementKey = createRefKey();
	var userRefKey = createRefKey();
	/** @param {Element} node */
	var setElement = (node) => {
		element.value = node;
		return () => {
			element.value = null;
		};
	};
	if (!(isServer ?? router.isServer)) {
		var hasRenderFetched = false;
		effect(() => {
			// Destination and mode changes cancel work for the previous input.
			state.value;
			preload();
			return cancelPreload;
		});
		effect(() => {
			if (!hasRenderFetched && preload() === 'render') {
				hasRenderFetched = true;
				untrack(doPreload);
			}
		});
		effect(() => {
			var mode = preload();
			var node = element.value;
			if (mode !== 'viewport' || !node || typeof IntersectionObserver === 'undefined') return;
			var active = true;
			var observer = new IntersectionObserver((entries) => {
				if (!active) return;
				if (!entries.length) return;
				if (entries[entries.length - 1].isIntersecting) untrack(schedulePreload);
				else cancelPreload();
			});
			observer.observe(node);
			return () => {
				active = false;
				cancelPreload();
				observer.disconnect();
			};
		});
	}
	/** @param {string} name @param {(event: any) => void} fallback */
	var compose = (name, fallback) => (/** @type {any} */ event) => {
		var props = inputs.value;
		var stateProps = functionalUpdate(
			(state.value.active ? props.activeProps : props.inactiveProps) ?? {},
			{},
		);
		var handler = stateProps?.[name] ?? props[name];
		if (typeof handler === 'function') handler.call(event.currentTarget, event);
		else handler?.handleEvent?.call(event.currentTarget, event);
		if (!event.defaultPrevented) fallback(event);
	};
	var handlers = {
		onClick: compose('onClick', (event) => {
			var current = state.value;
			if (current.disabled) {
				event.preventDefault();
				return;
			}
			var target = inputs.value.target ?? event.currentTarget?.getAttribute('target');
			if (
				current.external ||
				event.metaKey ||
				event.altKey ||
				event.ctrlKey ||
				event.shiftKey ||
				event.button !== 0 ||
				(target && target !== '_self') ||
				event.currentTarget?.hasAttribute('download')
			)
				return;
			event.preventDefault();
			cancelPreload();
			void router.navigate(current.dest).catch(console.error);
		}),
		onFocus: compose('onFocus', enqueuePreload),
		onMouseEnter: compose('onMouseEnter', enqueuePreload),
		onMouseOver: compose('onMouseOver', enqueuePreload),
		onBlur: compose('onBlur', () => {
			if (preload() === 'intent') cancelPreload();
		}),
		onMouseLeave: compose('onMouseLeave', () => {
			if (preload() === 'intent') cancelPreload();
		}),
		onMouseOut: compose('onMouseOut', () => {
			if (preload() === 'intent') cancelPreload();
		}),
		onTouchStart: compose('onTouchStart', () => {
			if (preload() === 'intent') doPreload();
		}),
	};
	return track(() => {
		var props = inputs.value;
		var current = state.value;
		/** @type {Record<string | symbol, any>} */
		var base = {};
		for (var key of Reflect.ownKeys(options)) {
			if (typeof key === 'symbol') base[key] = options[/** @type {any} */ (key)];
			else if (!ownKeys.has(key)) base[key] = props[key];
		}
		var selected =
			functionalUpdate(
				(current.active ? props.activeProps : props.inactiveProps) ??
					(current.active ? { class: 'active' } : {}),
				{},
			) ?? {};
		var result = {
			...base,
			...selected,
			...handlers,
			href: current.href,
			disabled: current.disabled || undefined,
			target: props.target,
			class: [base.class, selected.class],
			style: base.style || selected.style ? { ...base.style, ...selected.style } : undefined,
		};
		if (current.active) Object.assign(result, { 'data-status': 'active', 'aria-current': 'page' });
		if (current.disabled) Object.assign(result, { role: 'link', 'aria-disabled': true });
		delete result.ref;
		result[elementKey] = setElement;
		// Ripple host refs include callbacks with cleanup, tracked refs, and arrays.
		if (selected.ref ?? options.ref) result[userRefKey] = selected.ref ?? options.ref;
		return result;
	});
}

/** @template T @param {T} options @returns {T} */
export function linkOptions(options) {
	return options;
}
