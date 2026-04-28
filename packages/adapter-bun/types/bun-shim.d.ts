declare module 'bun' {
	export interface Server<T = unknown> {
		stop(): void;
	}

	export class CryptoHasher {
		constructor(algorithm: string);
		update(value: string): void;
		digest(format: 'hex'): string;
	}

	export interface BunFile {
		exists(): Promise<boolean>;
		size: number;
	}

	export function serve(options: {
		port: number;
		hostname: string;
		fetch(request: Request, server: Server<undefined>): Response | Promise<Response>;
	}): Server<undefined>;

	export function file(path: string): BunFile;
}
