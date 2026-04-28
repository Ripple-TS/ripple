/**
 * Merge multiple refs (function refs and ref objects) into a single
 * callback ref. Used by the tsrx-react, tsrx-preact, and tsrx-vue
 * compilers when an element has more than one `ref` attribute, since
 * those runtimes treat duplicate `ref` props as a regular duplicate-prop
 * collision (last wins) rather than running both. Solid does not use this
 * helper — its native runtime accepts an array of refs and the compiler
 * emits an array literal directly.
 *
 * The returned callback ref handles four cases per input:
 * - `null` / `undefined`: skipped.
 * - function ref: invoked with the node. If it returns a function, that
 *   return value is treated as a React 19 cleanup. Otherwise we record a
 *   cleanup that calls the ref with `null` so the legacy unmount contract
 *   still fires.
 * - React-style ref object (`{ current }`): assigned on mount, cleared
 *   on unmount.
 * - Vue-style ref object (`{ value }`, e.g. `ref()` / `useTemplateRef()`):
 *   assigned on mount, cleared on unmount.
 *
 * The merged ref always returns a cleanup. Under React 19 the cleanup
 * runs on unmount and the inner refs are not separately re-invoked with
 * `null`. Under older React, Preact, and Vue the cleanup return value
 * is ignored, so the runtime instead invokes the merged ref a second
 * time with `null` — which re-runs the loop body, calling each inner
 * with `null` and clearing each ref object. Either way every inner ref
 * sees a balanced mount/unmount.
 *
 * @param {...((node: any) => void | (() => void)) | { current: any } | { value: any } | null | undefined} refs
 * @returns {(node: any) => (() => void)}
 */
export function mergeRefs(...refs) {
	return (node) => {
		/** @type {Array<() => void>} */
		const cleanups = [];
		for (const ref of refs) {
			if (ref == null) continue;
			if (typeof ref === 'function') {
				const result = ref(node);
				if (typeof result === 'function') {
					cleanups.push(result);
				} else {
					cleanups.push(() => ref(null));
				}
			} else if ('current' in ref) {
				ref.current = node;
				cleanups.push(() => {
					ref.current = null;
				});
			} else if ('value' in ref) {
				ref.value = node;
				cleanups.push(() => {
					ref.value = null;
				});
			}
		}
		return () => {
			for (const cleanup of cleanups) cleanup();
		};
	};
}
