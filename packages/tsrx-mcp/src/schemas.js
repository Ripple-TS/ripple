import { z } from 'zod';

export const TARGET_SCHEMA = z.enum(['ripple', 'react', 'preact', 'solid', 'vue']);

export const target_match_schema = z.object({
	target: z.string(),
	compilerPackage: z.string(),
	signals: z.array(z.string()),
	score: z.number(),
});

export const target_detection_schema = {
	cwd: z.string(),
	packageJsonPath: z.string().nullable(),
	detectedTarget: z.string().nullable(),
	confidence: z.enum(['high', 'ambiguous', 'none']),
	matches: z.array(target_match_schema),
	message: z.string(),
};

export const compile_error_schema = z.object({
	message: z.string(),
	code: z.string().nullable(),
	type: z.string().nullable(),
	fileName: z.string().nullable(),
	pos: z.number().nullable(),
	end: z.number().nullable(),
	raisedAt: z.number().nullable(),
	loc: z.unknown(),
});

export const compile_result_schema = {
	ok: z.boolean(),
	target: z.string().nullable(),
	compilerPackage: z.string().nullable(),
	filename: z.string(),
	cwd: z.string(),
	errors: z.array(compile_error_schema),
	code: z.string().nullable(),
	css: z.string().nullable(),
};

export const format_error_schema = z.object({
	message: z.string(),
	name: z.string().nullable(),
	loc: z.unknown(),
});

export const format_result_schema = {
	ok: z.boolean(),
	filename: z.string(),
	cwd: z.string(),
	message: z.string().nullable(),
	configPath: z.string().nullable(),
	formatted: z.string().nullable(),
	changed: z.boolean(),
	errors: z.array(format_error_schema),
	check: z.boolean().nullable(),
};

export const advice_schema = z.object({
	kind: z.string(),
	severity: z.enum(['error', 'warning', 'info']),
	title: z.string(),
	message: z.string(),
	documentation: z.array(z.string()),
});

export const authoring_issue_schema = z.object({
	kind: z.string(),
	severity: z.enum(['error', 'warning', 'info']),
	title: z.string(),
	message: z.string(),
	snippet: z.string().nullable(),
	recommendation: z.string(),
	documentation: z.array(z.string()),
});

export const authoring_review_result_schema = {
	ok: z.boolean(),
	filename: z.string(),
	target: z.string().nullable(),
	summary: z.string(),
	issues: z.array(authoring_issue_schema),
	nextSteps: z.array(z.string()),
};

export const analysis_result_schema = {
	ok: z.boolean(),
	target: z.string().nullable(),
	compilerPackage: z.string().nullable(),
	filename: z.string(),
	cwd: z.string(),
	errors: z.array(compile_error_schema),
	advice: z.array(advice_schema),
	nextSteps: z.array(z.string()),
};

export const read_result_schema = z.object({
	ok: z.boolean(),
	error: z
		.object({
			message: z.string(),
			code: z.string().nullable(),
		})
		.nullable(),
});

export const validate_file_result_schema = {
	ok: z.boolean(),
	cwd: z.string(),
	filePath: z.string(),
	filename: z.string(),
	message: z.string().nullable(),
	read: read_result_schema,
	format: z.object(format_result_schema).nullable(),
	compile: z.object(compile_result_schema).nullable(),
	analysis: z.object(analysis_result_schema).nullable(),
};

export const package_signal_schema = z.object({
	name: z.string(),
	version: z.string(),
	field: z.string(),
});

export const inspect_project_result_schema = {
	cwd: z.string(),
	root: z.string().nullable(),
	packageJsonPath: z.string().nullable(),
	packageName: z.string().nullable(),
	packageManager: z.string().nullable(),
	target: z.object(target_detection_schema),
	configFiles: z.array(z.string()),
	tsrxPackages: z.array(package_signal_schema),
	targetPackages: z.array(
		z.object({
			target: z.string(),
			compilerPackage: z.string(),
			present: z.boolean(),
			packages: z.array(package_signal_schema),
		}),
	),
	tooling: z.array(
		z.object({
			name: z.string(),
			present: z.boolean(),
			version: z.string().nullable(),
			field: z.string().nullable(),
		}),
	),
	scripts: z.record(z.string(), z.string()),
	commands: z.object({
		format: z.string().nullable(),
		formatCheck: z.string().nullable(),
		typecheck: z.string().nullable(),
		test: z.string().nullable(),
	}),
	message: z.string(),
};
