/**
 * Whether `mount()` and `hydrate()` render the app under a default
 * try/pending/catch boundary. The Vite plugin's `rootBoundary: false` build
 * aliases this module to one exporting `false`; the bundler then drops the
 * boundary runtime from an app that renders without one.
 */
export const ROOT_BOUNDARY = true;
