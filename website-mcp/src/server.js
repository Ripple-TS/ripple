import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';

import { handleRequest } from './handler.js';

const port = Number(process.env.PORT ?? 3000);
const host = process.env.HOST ?? '0.0.0.0';
const index_url = new URL('../public/index.html', import.meta.url);

/**
 * @param {import('node:http').ServerResponse} res
 * @param {number} status
 * @param {string} body
 * @param {string} content_type
 */
function send(res, status, body, content_type) {
	res.statusCode = status;
	res.setHeader('Content-Type', content_type);
	res.end(body);
}

createServer(async (req, res) => {
	const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);

	if (url.pathname === '/mcp') {
		await handleRequest(req, res);
		return;
	}

	if (url.pathname === '/' || url.pathname === '/index.html') {
		const html = await readFile(index_url, 'utf8');
		send(res, 200, html, 'text/html; charset=utf-8');
		return;
	}

	send(
		res,
		404,
		JSON.stringify({ error: 'not_found', message: 'Use /mcp for TSRX MCP.' }, null, 2),
		'application/json; charset=utf-8',
	);
}).listen(port, host, () => {
	console.log(`TSRX MCP endpoint listening on http://${host}:${port}/mcp`);
});
