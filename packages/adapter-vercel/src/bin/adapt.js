#!/usr/bin/env node

/**
 * CLI entry point for `ripple-adapt-vercel`.
 *
 * Runs the adapt() function to generate Vercel Build Output API v3
 * from the Ripple build output.
 *
 * Usage:
 *   ripple-adapt-vercel [--out-dir dist] [--runtime nodejs22.x] [--regions iad1,sfo1]
 */

import { adapt } from '../adapt.js';

/**
 * Parse simple CLI flags.
 *
 * @param {string[]} argv
 * @returns {Record<string, string>}
 */
function parse_args(argv) {
	/** @type {Record<string, string>} */
	const args = {};
	for (let i = 0; i < argv.length; i++) {
		const arg = argv[i];
		if (arg.startsWith('--')) {
			const key = arg.slice(2);
			const value = argv[i + 1];
			if (value && !value.startsWith('--')) {
				args[key] = value;
				i++;
			} else {
				args[key] = 'true';
			}
		}
	}
	return args;
}

const args = parse_args(process.argv.slice(2));

/** @type {import('@ripple-ts/adapter-vercel').AdaptOptions} */
const options = {};

if (args['out-dir']) {
	options.outDir = args['out-dir'];
}

if (args['runtime'] || args['regions'] || args['memory'] || args['max-duration']) {
	options.serverless = {};
	if (args['runtime']) {
		options.serverless.runtime = args['runtime'];
	}
	if (args['regions']) {
		options.serverless.regions = args['regions'].split(',');
	}
	if (args['memory']) {
		options.serverless.memory = Number(args['memory']);
	}
	if (args['max-duration']) {
		options.serverless.maxDuration = Number(args['max-duration']);
	}
}

try {
	await adapt(options);
} catch (error) {
	console.error(error instanceof Error ? error.message : error);
	process.exit(1);
}
