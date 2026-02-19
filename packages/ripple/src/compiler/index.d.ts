import type * as AST from 'estree';
import type {
	CodeInformation as VolarCodeInformation,
	Mapping as VolarMapping,
} from '@volar/language-core';
import type { DocumentHighlightKind } from 'vscode-languageserver-types';
import type { RawSourceMap } from 'source-map';

// ============================================================================
// Compiler API Exports
// ============================================================================
/**
 * Result of compilation operation
 */
export interface CompileResult {
	/** The transformed AST */
	ast: AST.Program;
	/** The generated JavaScript code with source map */
	js: {
		code: string;
		map: RawSourceMap;
	};
	/** The generated CSS */
	css: string;
}

export interface DefinitionLocation {
	embeddedId: string; // e.g., 'style_0', 'style_1'
	start: number; // start offset
	end: number; // end offset
}

export interface PluginActionOverrides {
	/** Whether to enable word document highlighting for this mapping */
	wordHighlight?: {
		kind: DocumentHighlightKind;
	};
	/** TypeScript diagnostic codes to suppress for this mapping */
	suppressedDiagnostics?: number[];
	/** Custom hover documentation for this mapping, false to disable */
	hover?: string | false | ((content: string) => string);
	/** Custom definition info for this mapping, false to disable */
	definition?:
		| {
				description?: string; // just for reference
				// Generic location for embedded content (CSS, etc.)
				location?: DefinitionLocation;
				// Replace the type name in hover/definition with a different name
				// And provide the path to import the type definitions from
				// the `ripple` package directory, e.g. `types/index.d.ts`
				// Currently only supported by the definition plugin
				typeReplace?: {
					name: string;
					path: string;
				};
		  }
		| false;
}

export interface CustomMappingData extends PluginActionOverrides {
	generatedLengths: number[];
	embeddedId?: string; // e.g. css regions: 'style_0', 'style_1', etc.
	content?: string; // (e.g., css code)
}

export interface MappingData extends VolarCodeInformation {
	customData: CustomMappingData;
}

export interface CodeMapping extends VolarMapping<MappingData> {
	data: MappingData;
}

export interface CodeMappingWithAll extends CodeMapping {
	generatedLengths: number[];
}

export interface VolarMappingsResult {
	code: string;
	mappings: CodeMapping[];
	cssMappings: CodeMapping[];
	errors: RippleCompileError[];
}

export interface RippleCompileError extends Error {
	pos: number | undefined;
	raisedAt: number | undefined;
	end: number | undefined;
	loc: AST.SourceLocation | undefined;
	fileName: string | null;
	type: 'fatal' | 'usage';
}

/**
 * Compilation options
 */

interface SharedCompileOptions {
	minify_css?: boolean;
	dev?: boolean;
}
export interface CompileOptions extends SharedCompileOptions {
	mode?: 'client' | 'server';
}

export interface ParseOptions {
	loose?: boolean;
	errors?: RippleCompileError[];
	comments?: AST.CommentWithLocation[];
}

export interface AnalyzeOptions extends ParseOptions, Pick<CompileOptions, 'mode'> {
	errors?: RippleCompileError[];
	to_ts?: boolean;
}

export interface VolarCompileOptions
	extends Omit<ParseOptions, 'errors' | 'comments'>,
		SharedCompileOptions {}

export function parse(source: string, options?: ParseOptions): AST.Program;

export function compile(source: string, filename: string, options?: CompileOptions): CompileResult;

export function compile_to_volar_mappings(
	source: string,
	filename: string,
	options?: VolarCompileOptions,
): VolarMappingsResult;
