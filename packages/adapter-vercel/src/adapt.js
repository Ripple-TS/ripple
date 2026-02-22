/**
 * Build output generator for Vercel's Build Output API v3.
 *
 * Takes the Ripple build output (dist/client + dist/server) and restructures
 * it into `.vercel/output/` with proper routing, function config, and
 * dependency tracing.
 *
 * Modeled after @sveltejs/adapter-vercel but adapted for the Ripple
 * metaframework's architecture.
 */

/**
@import {
	AdaptOptions,
	VercelRoute,
	VercelConfig,
} from '@ripple-ts/adapter-vercel';
 */

import {
	existsSync,
	mkdirSync,
	cpSync,
	writeFileSync,
	rmSync,
	copyFileSync,
	statSync,
	symlinkSync,
	realpathSync,
} from 'node:fs';
import { resolve, join, dirname, relative, sep } from 'node:path';
import { createRequire } from 'node:module';
import { nodeFileTrace } from '@vercel/nft';

const require = createRequire(import.meta.url);
const { version: ADAPTER_VERSION } = require('../package.json');

// ============================================================================
// Constants
// ============================================================================

const VERCEL_OUTPUT_DIR = '.vercel/output';

/**
 * Detect the default Node.js runtime version for the current environment.
 *
 * @returns {string}
 */
function get_default_runtime() {
	const major = Number(process.version.slice(1).split('.')[0]);
	const valid = [20, 22, 24];

	if (!valid.includes(major)) {
		throw new Error(
			`Unsupported Node.js version: ${process.version}. ` +
				`Please use Node ${valid.join(' or ')} to build your project, ` +
				`or explicitly specify a runtime in adapter options.`,
		);
	}

	return `nodejs${major}.x`;
}

// ============================================================================
// File utilities
// ============================================================================

/**
 * Write a file, creating parent directories as needed.
 *
 * @param {string} file_path
 * @param {string} data
 */
function write(file_path, data) {
	mkdirSync(dirname(file_path), { recursive: true });
	writeFileSync(file_path, data);
}

/**
 * Copy a directory recursively, creating the destination if needed.
 *
 * @param {string} src
 * @param {string} dest
 */
function copy_dir(src, dest) {
	mkdirSync(dest, { recursive: true });
	cpSync(src, dest, { recursive: true });
}

// ============================================================================
// Dependency tracing
// ============================================================================

/**
 * @typedef {Object} TraceResult
 * @property {string} entry_path - Path to the traced entry file inside func_dir
 *   (relative to func_dir, e.g. "dist/server/entry.js")
 */

/**
 * Trace dependencies using @vercel/nft and copy them into the function directory.
 *
 * This ensures the serverless function bundle contains exactly the files it needs
 * at runtime, keeping cold start times minimal.
 *
 * Uses the project root as the nft `base` so that traced file paths are
 * project-relative. Files are copied into `func_dir` preserving their
 * project-relative structure, which keeps import paths correct.
 *
 * @param {string} entry - Absolute path to the entry file
 * @param {string} func_dir - Absolute path to the function output directory
 * @param {string} project_root - Absolute path to the project root
 * @returns {Promise<TraceResult>}
 */
async function trace_and_copy_dependencies(entry, func_dir, project_root) {
	// Use project root as the base for nft so paths are project-relative
	const base = project_root.endsWith(sep) ? project_root : project_root + sep;

	const traced = await nodeFileTrace([entry], { base: project_root });

	// Log non-fatal tracing warnings
	for (const warning of traced.warnings) {
		if (warning.message.startsWith('Failed to resolve dependency node:')) continue;
		if (warning.message.startsWith('Failed to parse')) continue;

		if (warning.message.startsWith('Failed to resolve dependency')) {
			console.warn(`[adapter-vercel] Warning: ${warning.message}`);
		}
	}

	// Determine the entry file's project-relative path so the caller can
	// derive a correct import path for the generated handler.
	const entry_relative = relative(project_root, entry);

	for (const file of traced.fileList) {
		const source = join(project_root, file);
		const dest = join(func_dir, file);

		const stats = statSync(source);
		const is_dir = stats.isDirectory();
		const realpath = realpathSync(source);

		mkdirSync(dirname(dest), { recursive: true });

		if (source !== realpath) {
			const real_relative = relative(project_root, realpath);
			const realdest = join(func_dir, real_relative);
			symlinkSync(relative(dirname(dest), realdest), dest, is_dir ? 'dir' : 'file');
		} else if (!is_dir) {
			copyFileSync(source, dest);
		}
	}

	return { entry_path: entry_relative };
}

// ============================================================================
// Handler template generation
// ============================================================================

/**
 * Generate the serverless function handler source code.
 *
 * Uses Vercel's native Web Standard API: the handler receives a Web Request
 * and returns a Web Response. No Node.js (req, res) conversion needed.
 *
 * Same-origin fetch short-circuiting is handled at the framework level
 * by patch_global_fetch in @ripple-ts/adapter.
 *
 * @param {string} server_entry_relative - Relative path from the function dir to
 * the server entry file
 * @returns {string}
 */
function generate_handler_source(server_entry_relative) {
	return `\
// Auto-generated by @ripple-ts/adapter-vercel
// Vercel Serverless Function handler for Ripple
//
// Uses Vercel's native Web Standard API (Request => Response).
// Same-origin fetch short-circuiting is handled at the framework level.
import { handler } from ${JSON.stringify(server_entry_relative)};

export default {
  async fetch(request) {
    try {
      return await handler(request);
    } catch (err) {
      console.error('[ripple] Serverless handler error:', err);
      return new Response('Internal Server Error', { status: 500 });
    }
  },
};
`;
}

// ============================================================================
// Vercel config generation
// ============================================================================

/**
 * Generate the Build Output API v3 config.json.
 *
 * @param {AdaptOptions} options
 * @returns {VercelConfig}
 */
function generate_vercel_config(options) {
	const {
		cleanUrls = true,
		trailingSlash,
		images,
		headers = [],
		redirects = [],
		rewrites = [],
	} = options;

	/** @type {VercelRoute[]} */
	const routes = [];

	// User-defined redirects
	for (const redirect of redirects) {
		routes.push({
			src: redirect.source,
			headers: { Location: redirect.destination },
			status: redirect.permanent ? 308 : 307,
		});
	}

	// Immutable cache headers for hashed assets
	routes.push({
		src: '/assets/.+',
		headers: {
			'Cache-Control': 'public, max-age=31536000, immutable',
		},
		continue: true,
	});

	// User-defined headers
	for (const header of headers) {
		routes.push({
			src: header.source,
			headers: Object.fromEntries(header.headers.map((h) => [h.key, h.value])),
			continue: true,
		});
	}

	// Let Vercel handle filesystem (static) routes first
	routes.push({ handle: 'filesystem' });

	// User-defined rewrites (inserted before the catch-all)
	for (const rewrite of rewrites) {
		routes.push({
			src: rewrite.source,
			dest: rewrite.destination,
		});
	}

	// Catch-all: send everything else to the serverless function
	routes.push({
		src: '/.*',
		dest: '/index',
	});

	/** @type {VercelConfig} */
	const config = {
		version: 3,
		routes,
	};

	if (cleanUrls !== undefined) {
		config.cleanUrls = cleanUrls;
	}

	if (trailingSlash !== undefined) {
		config.trailingSlash = trailingSlash;
	}

	if (images) {
		config.images = images;
	}

	return config;
}

// ============================================================================
// Main adapt function
// ============================================================================

/**
 * Generate Vercel Build Output API v3 from a Ripple build.
 *
 * Transforms the standard Ripple build output (`dist/client` + `dist/server`)
 * into `.vercel/output/` with:
 * - Static files served from Vercel's CDN
 * - A serverless function for SSR, API routes, and RPC
 * - Routing rules for proper request handling
 * - Dependency tracing via @vercel/nft for minimal bundle size
 *
 * @param {AdaptOptions} [options]
 * @returns {Promise<void>}
 */
export async function adapt(options = {}) {
	const { outDir = 'dist', serverless = {}, isr = false } = options;

	const project_root = process.cwd();
	const build_dir = resolve(project_root, outDir);
	const client_dir = join(build_dir, 'client');
	const server_dir = join(build_dir, 'server');
	const server_entry = join(server_dir, 'entry.js');
	const output_dir = resolve(project_root, VERCEL_OUTPUT_DIR);

	// ------------------------------------------------------------------
	// Validate build output exists
	// ------------------------------------------------------------------

	if (!existsSync(client_dir)) {
		throw new Error(
			`[adapter-vercel] Client build output not found at ${client_dir}. ` +
				`Run "vite build" before running the adapter.`,
		);
	}

	if (!existsSync(server_entry)) {
		throw new Error(
			`[adapter-vercel] Server entry not found at ${server_entry}. ` +
				`Make sure your project has a ripple.config.ts with an adapter configured.`,
		);
	}

	// ------------------------------------------------------------------
	// Clean and create output directory
	// ------------------------------------------------------------------

	console.log('[adapter-vercel] Generating Vercel Build Output...');

	rmSync(output_dir, { recursive: true, force: true });
	mkdirSync(output_dir, { recursive: true });

	// ------------------------------------------------------------------
	// 1. Copy static assets
	// ------------------------------------------------------------------

	const static_dir = join(output_dir, 'static');

	console.log('[adapter-vercel] Copying static assets...');
	copy_dir(client_dir, static_dir);

	// Remove index.html from static output — SSR handles the root route.
	// Vercel would serve the static index.html instead of the SSR function
	// if we leave it in place.
	const static_index_html = join(static_dir, 'index.html');
	if (existsSync(static_index_html)) {
		rmSync(static_index_html);
	}

	// ------------------------------------------------------------------
	// 2. Create the serverless function
	// ------------------------------------------------------------------

	const func_dir = join(output_dir, 'functions', 'index.func');
	mkdirSync(func_dir, { recursive: true });

	console.log('[adapter-vercel] Tracing server dependencies...');

	// Trace and copy all dependencies of the server entry.
	// The trace result tells us the project-relative path where the entry
	// was copied, which we need to derive a correct import.
	const trace_result = await trace_and_copy_dependencies(server_entry, func_dir, project_root);

	// Generate the handler that imports the server entry.
	// The entry lives at func_dir/<entry_path>, and the handler at func_dir/index.js,
	// so the import is relative from handler to entry.
	const handler_path = join(func_dir, 'index.js');
	const entry_in_func = join(func_dir, trace_result.entry_path);
	const server_entry_relative = './' + relative(dirname(handler_path), entry_in_func);

	write(handler_path, generate_handler_source(server_entry_relative));
	write(join(func_dir, 'package.json'), JSON.stringify({ type: 'module' }));

	// Function configuration
	const runtime = serverless.runtime ?? get_default_runtime();

	/** @type {Record<string, unknown>} */
	const vc_config = {
		runtime,
		handler: 'index.js',
		launcherType: 'Nodejs',
		experimentalResponseStreaming: true,
		framework: {
			slug: 'ripple',
			version: ADAPTER_VERSION,
		},
	};

	if (serverless.regions) {
		vc_config.regions = serverless.regions;
	}
	if (serverless.memory) {
		vc_config.memory = serverless.memory;
	}
	if (serverless.maxDuration) {
		vc_config.maxDuration = serverless.maxDuration;
	}

	// ISR (Incremental Static Regeneration) — adds a `prerender` config
	// that tells Vercel to cache the serverless response at the edge and
	// revalidate in the background after `expiration` seconds.
	if (isr) {
		/** @type {Record<string, unknown>} */
		const prerender = {
			expiration: isr.expiration,
		};

		if (isr.bypassToken) {
			prerender.bypassToken = isr.bypassToken;
		}

		if (isr.allowQuery !== undefined) {
			prerender.allowQuery = isr.allowQuery;
		}

		vc_config.prerender = prerender;

		console.log(
			`[adapter-vercel] ISR enabled (expiration: ${isr.expiration === false ? 'never' : isr.expiration + 's'})`,
		);
	}

	write(join(func_dir, '.vc-config.json'), JSON.stringify(vc_config, null, '\t'));

	// ------------------------------------------------------------------
	// 3. Generate the Build Output API config
	// ------------------------------------------------------------------

	console.log('[adapter-vercel] Writing config...');

	const vercel_config = generate_vercel_config(options);
	write(join(output_dir, 'config.json'), JSON.stringify(vercel_config, null, '\t'));

	// ------------------------------------------------------------------
	// Summary
	// ------------------------------------------------------------------

	console.log('[adapter-vercel] Build output generated at .vercel/output/');
	console.log(`  Static:   ${static_dir}`);
	console.log(`  Function: ${func_dir}`);
	console.log(`  Runtime:  ${runtime}`);
}
