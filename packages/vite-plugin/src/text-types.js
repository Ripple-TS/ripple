// @ts-check

import path from 'node:path';

/** @import { TextTypeProject } from '@tsrx/ripple/typescript' */
/** @import { RipplePluginOptions } from '../types/index' */

/**
 * One snapshot per production build. Automatic SSR sub-builds borrow their
 * client's snapshot so imported types cannot change hydration layout.
 * @param {RipplePluginOptions['textTypes']} option
 */
export function create_text_types(option) {
	if (
		option !== undefined &&
		option !== false &&
		(!option ||
			typeof option !== 'object' ||
			typeof option.tsconfig !== 'string' ||
			!option.tsconfig.trim())
	) {
		throw new Error('Ripple textTypes must be false or { tsconfig: string }');
	}
	/** @type {string | undefined} */
	let config_path;
	/** @type {Promise<TextTypeProject> | undefined} */
	let project;
	/** @type {ReturnType<typeof create_text_types> | undefined} */
	let parent;
	let enabled = false;

	/** @param {import('vite').ResolvedConfig} config */
	function configure(config) {
		enabled = !!option && config.command === 'build' && config.isProduction && !config.build.watch;
		config_path = option ? path.resolve(config.root, option.tsconfig) : undefined;
	}

	function start(watch = false) {
		if (watch) enabled = false;
		if (!parent) project = undefined;
	}

	/** @param {ReturnType<typeof create_text_types>} client */
	function share(client) {
		if (enabled !== client.enabled() || config_path !== client.configPath()) {
			throw new Error('Ripple client and server builds must use the same textTypes configuration');
		}
		parent = client;
	}

	/** @param {string} id @param {string} source @param {string} filename
	 * @returns {Promise<import("@tsrx/ripple").TextTypeFacts | undefined>} */
	async function get_facts(id, source, filename) {
		if (!enabled) return undefined;
		if (parent) return parent.getFacts(id, source, filename);
		project ??= import('@tsrx/ripple/typescript').then(
			({ createTextTypeProject: create_text_type_project }) =>
				create_text_type_project({ tsconfig: /** @type {string} */ (config_path) }),
		);
		const facts = (await project).getTextTypeFacts(id, source);
		// Ripple uses project-relative filenames for CSS hashes and RPC ids.
		return { ...facts, filename };
	}

	/** @returns {Promise<void>} */
	async function assert_unchanged() {
		if (parent) return parent.assertUnchanged();
		(await project)?.assertUnchanged();
	}

	async function dispose() {
		if (!parent) {
			try {
				(await project)?.dispose();
			} finally {
				project = undefined;
			}
		}
	}

	return {
		configure,
		start,
		share,
		getFacts: get_facts,
		assertUnchanged: assert_unchanged,
		dispose,
		enabled: () => enabled,
		configPath: () => config_path,
	};
}
