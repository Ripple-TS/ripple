// SSR helpers
export { create_ssr_stream as createStream, render } from '../runtime/internal/server/index.js';
export { get_css_text as getCss } from '../runtime/internal/server/css-registry.js';
export { prerender } from '../runtime/internal/server/prerender.js';
export { executeServerFunction } from '../runtime/internal/server/rpc.js';

// Re-export server runtime for components compiled for SSR
export * from '../runtime/index-server.js';
