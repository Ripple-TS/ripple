/**
 * Whether this build can hydrate server-rendered HTML. The Vite plugin's
 * `ssr: false` build aliases this module to one exporting `false`, and the
 * bundler then drops every hydration path in the runtime along with the
 * hydration cursor the compiled components no longer reference.
 */
export const HYDRATION = true;
