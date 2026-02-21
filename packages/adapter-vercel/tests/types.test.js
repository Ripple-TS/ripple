import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

describe('adapter-vercel types', () => {
	it('exports runtime and serve from adapter-node', () => {
		const types = readFileSync(join(__dirname, '..', 'types', 'index.d.ts'), 'utf-8');

		// Re-exports runtime
		expect(types).toContain('export const runtime: RuntimePrimitives');

		// Re-exports serve
		expect(types).toContain('export const serve: ServeFunction');
	});

	it('declares AdaptOptions interface', () => {
		const types = readFileSync(join(__dirname, '..', 'types', 'index.d.ts'), 'utf-8');

		expect(types).toContain('export interface AdaptOptions');
		expect(types).toContain('outDir?: string');
		expect(types).toContain('serverless?: ServerlessConfig');
	});

	it('declares ServerlessConfig interface', () => {
		const types = readFileSync(join(__dirname, '..', 'types', 'index.d.ts'), 'utf-8');

		expect(types).toContain('export interface ServerlessConfig');
		expect(types).toContain('runtime?: string');
		expect(types).toContain('regions?: string[]');
		expect(types).toContain('maxDuration?: number');
		expect(types).toContain('memory?: number');
	});

	it('declares VercelConfig interface for Build Output API v3', () => {
		const types = readFileSync(join(__dirname, '..', 'types', 'index.d.ts'), 'utf-8');

		expect(types).toContain('export interface VercelConfig');
		expect(types).toContain('version: 3');
		expect(types).toContain('routes: VercelRoute[]');
	});

	it('uses shared type aliases from @ripple-ts/adapter', () => {
		const types = readFileSync(join(__dirname, '..', 'types', 'index.d.ts'), 'utf-8');

		expect(types).toContain("from '@ripple-ts/adapter'");
		expect(types).toContain('RuntimePrimitives');
		expect(types).toContain('ServeFunction');
	});

	it('declares adapt() function', () => {
		const types = readFileSync(join(__dirname, '..', 'types', 'index.d.ts'), 'utf-8');

		expect(types).toContain('export function adapt(options?: AdaptOptions): Promise<void>');
	});

	it('declares ISRConfig interface', () => {
		const types = readFileSync(join(__dirname, '..', 'types', 'index.d.ts'), 'utf-8');

		expect(types).toContain('export interface ISRConfig');
		expect(types).toContain('expiration: number | false');
		expect(types).toContain('bypassToken?: string');
		expect(types).toContain('allowQuery?: string[]');
	});

	it('declares ImagesConfig interface', () => {
		const types = readFileSync(join(__dirname, '..', 'types', 'index.d.ts'), 'utf-8');

		expect(types).toContain('export interface ImagesConfig');
		expect(types).toContain('sizes: number[]');
		expect(types).toContain('domains: string[]');
	});

	it('declares Vercel routing types', () => {
		const types = readFileSync(join(__dirname, '..', 'types', 'index.d.ts'), 'utf-8');

		expect(types).toContain('export interface VercelHeader');
		expect(types).toContain('export interface VercelRedirect');
		expect(types).toContain('export interface VercelRewrite');
		expect(types).toContain('export interface VercelRoute');
	});
});
