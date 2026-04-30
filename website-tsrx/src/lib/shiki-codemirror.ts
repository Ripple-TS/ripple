import {
	EditorView,
	Decoration,
	ViewPlugin,
	type DecorationSet,
	type ViewUpdate,
} from '@codemirror/view';
import { type Extension, StateEffect, StateField } from '@codemirror/state';
import { createHighlighter, type ThemedToken, type Highlighter } from 'shiki';
import ripple_grammar from '../../../grammars/textmate/ripple.tmLanguage.json';

const modified_grammar = {
	...ripple_grammar,
	embeddedLangs: ['jsx', 'tsx', 'css'],
};

let highlighter_promise: Promise<Highlighter> | null = null;

function get_highlighter(): Promise<Highlighter> {
	if (!highlighter_promise) {
		highlighter_promise = createHighlighter({
			themes: ['one-dark-pro'],
			langs: [
				'javascript',
				'typescript',
				'jsx',
				'tsx',
				'css',
				'marko',
				modified_grammar as any,
				{ ...(modified_grammar as any), name: 'ripple' },
			],
		});
	}
	return highlighter_promise;
}

function build_decorations(doc: string, highlighter: Highlighter, lang: string): DecorationSet {
	if (!doc) return Decoration.none;

	let tokens: ThemedToken[][];
	try {
		const result = highlighter.codeToTokens(doc, {
			lang,
			theme: 'one-dark-pro',
		});
		tokens = result.tokens;
	} catch {
		return Decoration.none;
	}

	const ranges: { from: number; to: number; deco: Decoration }[] = [];

	for (let i = 0; i < tokens.length; i++) {
		for (const token of tokens[i]) {
			const from = token.offset;
			const to = from + token.content.length;
			if (token.color && to <= doc.length) {
				ranges.push({
					from,
					to,
					deco: Decoration.mark({ attributes: { style: `color: ${token.color}` } }),
				});
			}
		}
	}

	ranges.sort((a, b) => a.from - b.from || a.to - b.to);
	return Decoration.set(ranges.map((r) => r.deco.range(r.from, r.to)));
}

const set_decorations = StateEffect.define<DecorationSet>();

/**
 * Creates a CodeMirror extension that uses Shiki with a TextMate grammar
 * for syntax highlighting.
 */
export function shiki_highlight(lang: string): Extension {
	const field = StateField.define<DecorationSet>({
		create() {
			return Decoration.none;
		},
		update(value, tr) {
			for (const effect of tr.effects) {
				if (effect.is(set_decorations)) {
					return effect.value;
				}
			}
			return value;
		},
		provide: (f) => EditorView.decorations.from(f),
	});

	const plugin = ViewPlugin.define((view) => {
		let disposed = false;
		let pending_version = 0;

		function highlight(v: EditorView) {
			const doc = v.state.doc.toString();
			const version = ++pending_version;

			get_highlighter().then((h) => {
				if (disposed || pending_version !== version) return;
				const decos = build_decorations(doc, h, lang);
				v.dispatch({ effects: set_decorations.of(decos) });
			});
		}

		highlight(view);

		return {
			update(update: ViewUpdate) {
				if (update.docChanged) {
					highlight(update.view);
				}
			},
			destroy() {
				disposed = true;
			},
		};
	});

	return [field, plugin];
}
