// Vue's default bundler entry omits the Vapor runtime. Compose the Vapor and
// DOM bundler entries so the SFC helpers and nextTick share one reactivity
// instance, then let Vite's production define compile out development guards.
export * from '@vue/runtime-vapor';
export { shallowRef, nextTick, resolveComponent, toDisplayString } from '@vue/runtime-dom';
