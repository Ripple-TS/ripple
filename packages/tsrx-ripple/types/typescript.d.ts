import type { TextTypeFacts } from './index';

export interface TextTypeProject {
	getTextTypeFacts(filename: string, source?: string): TextTypeFacts;
	/** Discard all cached sources, imported types, and project configuration. */
	invalidate(): void;
	/** Fail if any file read by the project has changed since it was read. */
	assertUnchanged(): void;
	dispose(): void;
}

/** Node-only, optional TypeScript analysis for Ripple DOM text children. */
export function createTextTypeProject(options: { tsconfig: string }): TextTypeProject;
