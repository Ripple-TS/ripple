import { handleRequest } from '../src/handler.js';

export default async function handler(req, res) {
	await handleRequest(req, res);
}
