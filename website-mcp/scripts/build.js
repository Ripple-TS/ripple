import { mkdir } from 'node:fs/promises';

await mkdir(new URL('../public', import.meta.url), { recursive: true });
