// `vue` alias target (see vite.config.js): vue 3.6's default bundler entry
// does not include the vapor runtime, and the prebuilt
// vue.runtime-with-vapor.esm-browser.prod.js dist crashes on mount in
// 3.6.0-beta.17 ("Cannot read properties of undefined (reading 'anchor')" —
// its dev twin works). Composing the two bundler entries instead keeps the
// process.env.NODE_ENV guards (vite's production define compiles them out) and
// a single shared @vue/reactivity instance. The explicit re-exports win over
// any overlapping names in the star export, per ES module semantics.
export * from '@vue/runtime-vapor';
export {
	ref,
	shallowRef,
	unref,
	triggerRef,
	computed,
	nextTick,
	toDisplayString,
	onMounted,
	onUnmounted,
	watch,
	watchEffect,
	watchPostEffect,
	useTemplateRef,
	provide,
	inject,
} from '@vue/runtime-dom';
