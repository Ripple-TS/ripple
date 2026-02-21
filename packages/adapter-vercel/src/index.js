/**
 * @ripple-ts/adapter-vercel — Vercel adapter for the Ripple metaframework.
 *
 * Re-exports Node.js runtime primitives from @ripple-ts/adapter-node
 * (Vercel Serverless Functions run on Node.js) and provides the `adapt()`
 * function that generates Vercel's Build Output API v3 structure.
 */

export { runtime, serve } from '@ripple-ts/adapter-node';
export { adapt } from './adapt.js';
