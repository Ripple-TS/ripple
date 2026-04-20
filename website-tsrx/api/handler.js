import { handler } from '../dist/server/entry.js';

export default {
	/** @param {Request} request */
	async fetch(request) {
		try {
			return await handler(request);
		} catch (err) {
			console.error('[tsrx] Serverless handler error:', err);
			return new Response('Internal Server Error', { status: 500 });
		}
	},
};
