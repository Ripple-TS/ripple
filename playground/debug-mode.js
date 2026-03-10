import fs from 'node:fs/promises';
import path from 'node:path';
import { compile, compile_to_volar_mappings } from 'ripple/compiler';

let mode_type = process.argv[2] || 'server';

if (
	mode_type !== 'client' &&
	mode_type !== 'server' &&
	mode_type !== 'all' &&
	mode_type !== 'tsx'
) {
	console.error(`Invalid mode: ${mode_type}. Must be 'client', 'server', 'all', or 'tsx'.`);
	process.exit(1);
}
console.log(`Compiling in ${mode_type} mode...`);

const compile_modes = mode_type == 'all' ? ['client', 'server', 'tsx'] : [mode_type];
const files = (await fs.readdir('./src/')).filter((file) => file.endsWith('.ripple'));

for (const mode of compile_modes) {
	const dir = './src/';
	const output_dir = `./debug/${mode}`;

	await fs.rm(output_dir, { recursive: true, force: true });
	await fs.mkdir(output_dir, { recursive: true });

	for (const filename of files) {
		if (filename.endsWith('.ripple')) {
			const source = await fs.readFile(path.join(dir, filename), 'utf-8');
			const result =
				mode !== 'tsx'
					? compile(source, filename, { mode: mode })
					: compile_to_volar_mappings(source, filename, { loose: true });
			const base_name = filename.replace('.ripple', '');
			const file_path = `${output_dir}/${base_name}`;

			if (mode !== 'tsx') {
				await fs.writeFile(`${file_path}.js`, result.js.code);
				if (result.css) {
					await fs.writeFile(`${file_path}.css`, result.css);
				}
			} else {
				await fs.writeFile(`${file_path}.tsx`, result.code);

				// Also output mappings for debugging
				await fs.writeFile(`${file_path}.mappings.json`, JSON.stringify(result.mappings, null, 2));
			}
		}
	}
}
