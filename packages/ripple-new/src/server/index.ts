/**
 * `ripple-new/server` — server-rendering entry (SSR Phase 1).
 *
 * Re-exports the server runtime. The `@tsrx/ripple-new` compiler, in
 * `mode: 'server'`, emits component modules that `import { … } from
 * 'ripple-new/server'` — pulling the server hook implementations and the `ssr*`
 * string-building helpers from here. `render(Component, props)` is the server
 * analogue of `createRoot().render()`.
 */

export {
	// Entry
	render,
	type RenderResult,
	setSsrSuspenseTimeout,
	getSsrSuspenseTimeout,

	// Hooks (server semantics)
	useState,
	useReducer,
	useEffect,
	useLayoutEffect,
	useInsertionEffect,
	useImperativeHandle,
	useMemo,
	useCallback,
	useRef,
	useId,
	useEffectEvent,
	useTransition,
	useDeferredValue,
	useSyncExternalStore,
	useActionState,
	useFormStatus,
	useOptimistic,
	memo,

	// Context
	createContext,
	use,
	useContext,
	ssrIsSuspense,
	type Context,
	type FormStatus,

	// Compiler-emitted codegen helpers
	escapeHtml,
	escapeAttr,
	ssrText,
	ssrChild,
	ssrAttr,
	ssrStyle,
	ssrSpread,
	ssrComponent,
	ssrBlock,
	ssrPortal,
	injectStyle,
	ssrHeadEl,
} from '../runtime.server';
