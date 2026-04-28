import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const fixture_dir = fileURLToPath(new URL('.', import.meta.url));
const tsconfig_path = fileURLToPath(new URL('./tsconfig.json', import.meta.url));
const tsrx_tsc_path = fileURLToPath(
	new URL('../../../../typescript-plugin/dist/tsc.js', import.meta.url),
);

/**
 * @returns {Promise<{ code: number | null, stdout: string, stderr: string }>}
 */
function run_tsrx_tsc() {
	return new Promise((resolve, reject) => {
		const child = spawn(process.execPath, [tsrx_tsc_path, '--noEmit', '-p', tsconfig_path], {
			cwd: fixture_dir,
			stdio: 'pipe',
		});

		let stdout = '';
		let stderr = '';

		child.stdout.on('data', (chunk) => {
			stdout += String(chunk);
		});
		child.stderr.on('data', (chunk) => {
			stderr += String(chunk);
		});
		child.on('error', reject);
		child.on('close', (code) => {
			resolve({ code, stdout, stderr });
		});
	});
}

describe('tsrx-react fixtures: react-router typecheck', () => {
	it('typechecks TSX, TSRX, and third-party React Router types together', async () => {
		const result = await run_tsrx_tsc();

		expect(result, result.stdout + result.stderr).toMatchObject({ code: 0 });
	}, 30000);
});
