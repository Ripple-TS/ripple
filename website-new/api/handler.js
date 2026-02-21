/**
 * Vercel Serverless Function handler.
 *
 * This thin wrapper imports the production server entry and exports its
 * fetch-style handler for Vercel's Node.js serverless runtime.
 *
 * The server entry uses @ripple-ts/adapter-node's runtime under the hood
 * (node:crypto for hashing, AsyncLocalStorage for request context).
 * Since Vercel Serverless Functions run on Node.js, no separate adapter is needed.
 */
import { handler } from '../dist/server/entry.js';

export default handler;
