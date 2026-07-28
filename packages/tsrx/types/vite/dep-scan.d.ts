export interface DepScanCompiled {
	code: string;
}

export type DepScanCompile = (
	code: string,
	id: string,
) => DepScanCompiled | Promise<DepScanCompiled>;

export interface DepScanModule {
	code: string;
	moduleType: string;
}

export interface DepScanTransformPlugin {
	name: string;
	transform: {
		filter: { id: RegExp };
		handler: (code: string, id: string) => Promise<DepScanModule>;
	};
}

export interface DepScanLoadPlugin {
	name: string;
	load: (id: string) => Promise<DepScanModule | null>;
}
