import { describe, expect, it } from 'vitest';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { URI } from 'vscode-uri';
import { createAutoInsertPlugin } from '../src/autoInsertPlugin.js';

/**
 * @param {string} source
 */
async function get_auto_insert_snippet(source) {
	const uri = URI.file('/test/App.tsrx').toString();
	const document = TextDocument.create(uri, 'ripple', 0, source);
	const offset = source.length;
	const virtualCode = {
		languageId: 'ripple',
		originalCode: source,
		findMappingByGeneratedRange() {
			return { sourceOffsets: [offset - 1] };
		},
		findMappingBySourceRange() {
			return {};
		},
	};
	const context = {
		decodeEmbeddedDocumentUri() {
			return [URI.file('/test/App.tsrx'), 'tsrx'];
		},
		language: {
			scripts: {
				get() {
					return {
						generated: {
							embeddedCodes: {
								get() {
									return virtualCode;
								},
							},
						},
					};
				},
			},
			maps: {
				get() {
					return undefined;
				},
			},
		},
	};
	const service = createAutoInsertPlugin().create(context);
	return service.provideAutoInsertSnippet(
		document,
		document.positionAt(offset),
		{ rangeOffset: offset - 1, rangeLength: 0, text: '>' },
		{},
	);
}

describe('auto insert plugin', () => {
	it('auto-closes dynamic tag expression names', async () => {
		await expect(get_auto_insert_snippet('<${tag}>')).resolves.toBe('$0</${tag}>');
	});

	it('auto-closes member-form dynamic tag expression names', async () => {
		await expect(get_auto_insert_snippet('<${props.as}>')).resolves.toBe('$0</${props.as}>');
	});

	it('does not treat dynamic tag expression names as static void elements', async () => {
		await expect(get_auto_insert_snippet('<${input}>')).resolves.toBe('$0</${input}>');
	});
});
