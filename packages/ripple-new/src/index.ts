import pkg from '../package.json' with { type: 'json' };

// Source the version from package.json so it can't drift from the published
// package version (the previous hardcoded literal already had).
export const version: string = pkg.version;

export {
	// Public API
	createRoot,
	flushSync,
	drainPassiveEffects,
	act,
	setIsRippleActEnvironment,
	type Root,

	// Hooks
	useState,
	useReducer,
	useEffect,
	useLayoutEffect,
	useInsertionEffect,
	useMemo,
	useCallback,
	useRef,
	useId,
	useImperativeHandle,
	useEffectEvent,
	useSyncExternalStore,
	useDeferredValue,
	useTransition,
	startTransition,
	setTransitionFallbackTimeout,
	getTransitionFallbackTimeout,
	memo,

	// Context
	createContext,
	use,
	type Context,

	// HMR (compiler-emitted when the Vite plugin's hmr option is on)
	hmr,
	HMR,

	// Compiler-emitted runtime helpers
	template,
	clone,
	setText,
	setAttribute,
	setClassName,
	setStyle,
	setSpread,
	attachRef,
	injectStyle,
	delegateEvents,
	forBlock,
	ifBlock,
	tryBlock,
	switchBlock,
	componentSlot,
	componentSlotLite,
	Fragment,
	FragmentInstance,
	mountFragmentRef,
	portal,
	createPortal,
	type PortalDescriptor,
	withScope,
	renderBlock,
	createBlock,
	unmountBlock,
	scheduleRender,
	getCurrentScope,
	getCurrentBlock,
	type ComponentBody,
	type Scope,
	type Block,
} from './runtime';
