import type { Tracked } from 'ripple';
import { bindNode, bindValue, effect, track } from 'ripple';

import { DEFAULT_DEMO_SOURCE } from '../lib/demo.ts';
import { DEMO_SNIPPETS } from '../lib/demo-snippets.ts';

const MAX_SOURCE_LENGTH = 12000;
const DEBOUNCE_MS = 280;
const HASH_DEBOUNCE_MS = 400;
const CUSTOM_SNIPPET_VALUE = '__custom';
const EMPTY_DEMO_SOURCE = '';
const TARGET_OPTIONS = [
	{ value: 'react', label: 'React' },
	{ value: 'preact', label: 'Preact' },
	{ value: 'ripple', label: 'Ripple' },
	{ value: 'solid', label: 'Solid' },
	{ value: 'vue', label: 'Vue' },
];
const TARGET_LABELS: Record<string, string> = {
	react: 'React output',
	preact: 'Preact output',
	vue: 'Vue output',
	ripple: 'Ripple output',
	solid: 'Solid output',
};

const VALID_TARGETS = new Set(TARGET_OPTIONS.map((o) => o.value));
const SNIPPET_BY_VALUE = new Map(DEMO_SNIPPETS.map((snippet) => [snippet.value, snippet]));

function is_snippet_available_for_target(snippet: { targets?: string[] }, target: string): boolean {
	return !snippet.targets || snippet.targets.includes(target);
}

function get_first_available_snippet(target: string) {
	return DEMO_SNIPPETS.find((snippet) => is_snippet_available_for_target(snippet, target)) ?? null;
}

function get_snippet_value_for_source(source: string): string {
	for (const snippet of DEMO_SNIPPETS) {
		if (snippet.source === source) {
			return snippet.value;
		}
	}

	return CUSTOM_SNIPPET_VALUE;
}

function encode_hash(source: string, target: string): string {
	const payload = JSON.stringify({ s: source, t: target });
	if (typeof window !== 'undefined' && typeof window.btoa === 'function') {
		return btoa(String.fromCharCode(...new TextEncoder().encode(payload)));
	}
	return '';
}

function decode_hash(hash: string): { source: string; target: string } | null {
	try {
		const json = new TextDecoder().decode(Uint8Array.from(atob(hash), (c) => c.charCodeAt(0)));
		const parsed = JSON.parse(json);
		if (
			typeof parsed?.s === 'string' && typeof parsed?.t === 'string' && VALID_TARGETS.has(parsed.t)
		) {
			return { source: parsed.s, target: parsed.t };
		}
	} catch {
		// ignore malformed hashes
	}
	return null;
}

function join_compiled_output(code: string, css: string): string {
	if (!css) {
		return code.trimEnd();
	}

	return `${code.trimEnd()}\n\n/* CSS */\n${css.trimEnd()}`;
}

export component CompilerDemo() {
	let source_ref: Tracked<HTMLElement> = track();
	let output_ref: Tracked<HTMLElement> = track();

	const initial_hash =
		typeof window !== 'undefined' ? decode_hash(window.location.hash.slice(1)) : null;
	const initial_source = initial_hash?.source ?? DEFAULT_DEMO_SOURCE;

	let selected_target: Tracked<string> = track(initial_hash?.target ?? 'react');
	let selected_snippet: Tracked<string> = track(get_snippet_value_for_source(initial_source));

	let &[status] = track('Hydrating compiler...');
	let &[error_message] = track('');
	let &[last_updated] = track('');
	let &[editors_ready] = track(false);
	let &[formatting] = track(false);
	let active_mobile_panel: Tracked<'input' | 'output'> = track('input');
	let latest_source = initial_source;
	let request_compile = () => {};
	let load_source = (_next_source: string) => {};
	let format_source = async () => {};

	effect(() => {
		if (!source_ref.value || !output_ref.value) {
			return;
		}

		let disposed = false;
		let source_view: any;
		let output_view: any;
		let debounce_id = 0;
		let hash_debounce_id = 0;
		let request_id = 0;
		let active_controller: AbortController | null = null;

		const update_hash = (source: string) => {
			window.clearTimeout(hash_debounce_id);
			hash_debounce_id = window.setTimeout(() => {
				const encoded = encode_hash(source, selected_target.value);
				if (encoded) {
					history.replaceState(null, '', '#' + encoded);
				}
			}, HASH_DEBOUNCE_MS);
		};

		(async () => {
			const [{ EditorState }, { oneDark }, {
				history,
				defaultKeymap,
				historyKeymap,
				indentWithTab,
			}, view_mod, shiki_mod] = await Promise.all([
				import('@codemirror/state'),
				import('@codemirror/theme-one-dark'),
				import('@codemirror/commands'),
				import('@codemirror/view'),
				import('../lib/shiki-codemirror.ts'),
			]);

			if (disposed || !source_ref.value || !output_ref.value) {
				return;
			}

			const { EditorView, keymap, lineNumbers, highlightActiveLine, drawSelection } = view_mod;
			const { shiki_highlight } = shiki_mod;

			const shared_theme = EditorView.theme(
				{
					'&': {
						height: '100%',
						backgroundColor: '#091225',
						color: '#e7ecff',
						fontFamily: 'Spline Sans Mono, SFMono-Regular, monospace',
						fontSize: '0.9rem',
					},
					'.cm-scroller': {
						overflow: 'auto',
					},
					'.cm-content': {
						padding: '1rem 0.75rem 1.25rem',
						minHeight: '100%',
					},
					'.cm-gutters': {
						backgroundColor: '#091225',
						color: 'rgba(183, 198, 255, 0.5)',
						border: 'none',
					},
					'.cm-activeLine, .cm-activeLineGutter': {
						backgroundColor: 'rgba(133, 155, 255, 0.09)',
					},
					'.cm-selectionBackground': {
						backgroundColor: 'rgba(138, 152, 255, 0.34) !important',
					},
					'.cm-cursor': {
						borderLeftColor: '#d7dfff',
					},
				},
			);

			const editable_extensions = [
				lineNumbers(),
				history(),
				drawSelection(),
				highlightActiveLine(),
				keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
				EditorView.lineWrapping,
				shiki_highlight('ripple'),
				shared_theme,
			];

			const readonly_extensions = [
				lineNumbers(),
				EditorState.readOnly.of(true),
				EditorView.editable.of(false),
				EditorView.lineWrapping,
				EditorState.tabSize.of(2),
				shiki_highlight('tsx'),
				shared_theme,
			];

			const replace_doc = (view: any, next_doc: string) => {
				view.dispatch(
					{
						changes: { from: 0, to: view.state.doc.length, insert: next_doc },
					},
				);
			};

			const compile_source = async (source: string) => {
				latest_source = source;

				if (source.trim().length === 0) {
					error_message = '';
					status = 'Waiting for input';
					replace_doc(output_view, '// Start typing TSRX to see compiled output.');
					return;
				}

				if (source.length > MAX_SOURCE_LENGTH) {
					error_message = `Source is limited to ${MAX_SOURCE_LENGTH} characters for the live demo.`;
					status = 'Source limit reached';
					return;
				}

				const current_request_id = ++request_id;
				status = `Compiling ${TARGET_LABELS[selected_target.value] ?? 'selected target'}...`;
				error_message = '';

				active_controller?.abort();
				active_controller = new AbortController();

				try {
					const response = await fetch('/api/compile', {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
						},
						body: JSON.stringify({ source, target: selected_target.value }),
						signal: active_controller.signal,
					});

					const payload = await response.json();

					if (disposed || current_request_id !== request_id) {
						return;
					}

					if (!response.ok) {
						error_message = payload.error || 'Compilation failed.';
						status = 'Compiler reported an error';
						return;
					}

					replace_doc(output_view, join_compiled_output(payload.output.code, payload.output.css));
					status = `${TARGET_LABELS[payload.target] ?? 'Selected output'} ready`;
					last_updated = new Date().toLocaleTimeString([], {
						hour: '2-digit',
						minute: '2-digit',
						second: '2-digit',
					});
				} catch (error) {
					if (disposed || active_controller?.signal.aborted) {
						return;
					}

					error_message = error instanceof Error ? error.message : 'Compilation failed.';
					status = 'Network or compiler failure';
				}
			};

			source_ref.value.innerHTML = '';
			output_ref.value.innerHTML = '';

			request_compile = () => {
				if (source_view) {
					void compile_source(source_view.state.doc.toString());
				}
			};

			load_source = (next_source: string) => {
				latest_source = next_source;

				if (!source_view) {
					return;
				}

				replace_doc(source_view, next_source);
			};

			format_source = async () => {
				if (!source_view || formatting) {
					return;
				}

				const current = source_view.state.doc.toString();
				if (!current.trim()) {
					return;
				}

				formatting = true;
				try {
					const response = await fetch('/api/format', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ source: current }),
					});

					const payload = await response.json();

					if (disposed) {
						return;
					}

					if (!response.ok) {
						error_message = payload.error || 'Formatting failed.';
						return;
					}

					if (typeof payload.source === 'string' && payload.source !== current) {
						replace_doc(source_view, payload.source);
					}
				} catch (error) {
					if (disposed) {
						return;
					}
					error_message = error instanceof Error ? error.message : 'Formatting failed.';
				} finally {
					formatting = false;
				}
			};

			source_view = new EditorView({
				state: EditorState.create(
					{
						doc: latest_source,
						extensions: [
							...editable_extensions,
							EditorView.updateListener.of((update: any) => {
								if (!update.docChanged) {
									return;
								}

								const next_source = update.state.doc.toString();

								window.clearTimeout(debounce_id);
								debounce_id = window.setTimeout(() => {
									void compile_source(next_source);
								}, DEBOUNCE_MS);
								update_hash(next_source);
							}),
						],
					},
				),
				parent: source_ref.value,
			});

			output_view = new EditorView({
				state: EditorState.create(
					{
						doc: '// Compiled output will appear here after the first compile.',
						extensions: readonly_extensions,
					},
				),
				parent: output_ref.value,
			});

			await compile_source(latest_source);
			editors_ready = true;
		})();

		return () => {
			disposed = true;
			request_compile = () => {};
			load_source = (_next_source: string) => {};
			format_source = async () => {};
			window.clearTimeout(debounce_id);
			window.clearTimeout(hash_debounce_id);
			active_controller?.abort();
			source_view?.destroy();
			output_view?.destroy();
		};
	});

	effect(() => {
		selected_target.value;

		const snippet = SNIPPET_BY_VALUE.get(selected_snippet.value);
		if (snippet && !is_snippet_available_for_target(snippet, selected_target.value)) {
			const fallback = get_first_available_snippet(selected_target.value);
			if (fallback) {
				selected_snippet.value = fallback.value;
				if (fallback.source !== latest_source) {
					load_source(fallback.source);
				}
			} else {
				selected_snippet.value = CUSTOM_SNIPPET_VALUE;
			}
		}

		request_compile();
		const encoded = encode_hash(latest_source, selected_target.value);
		if (encoded) {
			history.replaceState(null, '', '#' + encoded);
		}
	});

	effect(() => {
		if (selected_snippet.value === CUSTOM_SNIPPET_VALUE) {
			if (latest_source === EMPTY_DEMO_SOURCE) {
				return;
			}

			load_source(EMPTY_DEMO_SOURCE);
			return;
		}

		const snippet = SNIPPET_BY_VALUE.get(selected_snippet.value);
		if (!snippet) {
			return;
		}

		if (snippet.source === latest_source) {
			return;
		}

		load_source(snippet.source);
	});

	<section class="demo-shell" id="demo">
		<div class="demo-header">
			<div>
				<p class="demo-kicker">{'TSRX Playground'}</p>
			</div>
			<div class="demo-toolbar">
				<label class="snippet-picker">
					<select class="snippet-select" {ref bindValue(selected_snippet)}>
						<option value={CUSTOM_SNIPPET_VALUE}>{'Custom Source'}</option>
						for (const snippet of DEMO_SNIPPETS) {
							if (is_snippet_available_for_target(snippet, selected_target.value)) {
								<option value={snippet.value}>{snippet.label}</option>
							}
						}
					</select>
				</label>
				<label class="target-picker">
					<select class="target-select" {ref bindValue(selected_target)}>
						for (const option of TARGET_OPTIONS) {
							<option value={option.value}>{option.label}</option>
						}
					</select>
				</label>
			</div>
		</div>

		<div class={`demo-grid${editors_ready ? ' ready' : ''}`}>
			<div class={`panel panel-source${active_mobile_panel.value === 'input' ? ' is-active' : ''}`}>
				<div class="panel-topline">
					<span>{'TSRX input'}</span>
					<span class="panel-topline-actions">
						<span>{'.tsrx'}</span>
						<button
							type="button"
							class="format-button"
							onClick={() => {
								void format_source();
							}}
							disabled={formatting || !editors_ready}
							title="Format with Prettier"
						>
							{formatting ? 'Formatting…' : 'Format'}
						</button>
					</span>
				</div>
				<div class="panel-body editor-host" {ref bindNode(source_ref)} />
			</div>

			<div
				class={`panel panel-output${active_mobile_panel.value === 'output' ? ' is-active' : ''}`}
			>
				<div class="panel-topline">
					<span>{TARGET_LABELS[selected_target.value]}</span>
				</div>
				<div class="panel-body">
					if (error_message) {
						<div class="panel-error" role="alert">{error_message}</div>
					}
					<div class="editor-host" {ref bindNode(output_ref)} />
				</div>
			</div>
		</div>

		<div class="mobile-pane-toggle" aria-label="Switch visible panel">
			<button
				type="button"
				class={`pane-button${active_mobile_panel.value === 'input' ? ' is-active' : ''}`}
				onClick={() => {
					active_mobile_panel.value = 'input';
				}}
			>
				{'input'}
			</button>
			<button
				type="button"
				class={`pane-button${active_mobile_panel.value === 'output' ? ' is-active' : ''}`}
				onClick={() => {
					active_mobile_panel.value = 'output';
				}}
			>
				{'output'}
			</button>
		</div>
	</section>

	<style>
		.demo-shell {
			background: transparent;
			box-shadow: none;
			flex: 1;
			display: flex;
			flex-direction: column;
			min-height: 0;
		}

		.demo-header {
			display: flex;
			justify-content: space-between;
			gap: 1.25rem;
			align-items: end;
			width: min(1180px, calc(100vw - 2rem));
			margin: 0 auto;
			padding: 0 0 0.75rem;
			flex-wrap: wrap;
		}

		.demo-kicker {
			margin: 0 0 0.45rem;
			font-size: 0.78rem;
			letter-spacing: 0.18em;
			text-transform: uppercase;
			color: #6e44df;
		}

		.demo-header h2 {
			margin: 0;
			font-size: clamp(1.45rem, 2vw, 2.2rem);
			max-width: 34rem;
			color: #1a1640;
		}

		.demo-copy {
			margin: 0.7rem 0 0;
			max-width: 36rem;
			font-size: 0.98rem;
			line-height: 1.65;
			color: rgba(26, 22, 64, 0.74);
		}

		.demo-toolbar {
			display: flex;
			gap: 0.75rem;
			align-items: center;
			justify-content: flex-end;
			flex-wrap: wrap;
		}

		.snippet-picker,
		.target-picker {
			display: grid;
			gap: 0;
		}

		.snippet-select,
		.target-select {
			min-width: 11rem;
			padding: 0.75rem 3rem 0.75rem 1.2rem;
			border: 1px solid rgba(94, 44, 255, 0.12);
			border-radius: 0.9rem;
			background-color: rgba(255, 255, 255, 0.92);
			color: #1a1640;
			appearance: none;
			-webkit-appearance: none;
			-moz-appearance: none;
			background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='none'%3E%3Cpath d='M6 8l4 4 4-4' stroke='%231a1640' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
			background-repeat: no-repeat;
			background-size: 0.95rem;
			background-position: right 1.2rem center;
		}

		.demo-status-row {
			display: flex;
			flex-direction: column;
			gap: 0.25rem;
			align-items: flex-end;
		}

		.demo-status,
		.demo-updated {
			font-size: 0.8rem;
			color: rgba(26, 22, 64, 0.72);
		}

		.demo-status {
			padding: 0.45rem 0.7rem;
			background: rgba(111, 0, 255, 0.08);
		}

		.demo-grid {
			display: grid;
			grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
			gap: 0;
			flex: 1;
			min-height: 0;
		}

		.mobile-pane-toggle {
			display: none;
		}

		.panel {
			min-width: 0;
			min-height: 0;
			background: #040a18;
			overflow: hidden;
			display: flex;
			flex-direction: column;
		}

		.panel-topline {
			display: flex;
			justify-content: space-between;
			align-items: center;
			gap: 1rem;
			padding: 0.4rem 1rem;
			min-height: 2.5rem;
			background: rgba(255, 255, 255, 0.03);
			font-size: 0.78rem;
			letter-spacing: 0.06em;
			text-transform: uppercase;
			color: rgba(214, 224, 255, 0.78);
		}

		.panel-topline-actions {
			display: inline-flex;
			align-items: center;
			gap: 0.6rem;
		}

		.format-button {
			font: inherit;
			font-size: 0.72rem;
			letter-spacing: 0.08em;
			text-transform: uppercase;
			padding: 0.3rem 0.7rem;
			border-radius: 999px;
			border: 1px solid rgba(138, 152, 255, 0.32);
			background: rgba(138, 152, 255, 0.12);
			color: rgba(226, 231, 255, 0.92);
			cursor: pointer;
			transition:
				background 120ms ease,
				border-color 120ms ease,
				color 120ms ease;
		}

		.format-button:hover:not(:disabled) {
			background: rgba(138, 152, 255, 0.22);
			border-color: rgba(138, 152, 255, 0.55);
			color: #fff;
		}

		.format-button:disabled {
			opacity: 0.45;
			cursor: not-allowed;
		}

		.panel-body {
			flex: 1;
			min-height: 0;
			display: flex;
			flex-direction: column;
		}

		.panel-error {
			padding: 0.8rem 1rem;
			background: #e01174;
			color: #fff;
			font-size: 0.9rem;
			line-height: 1.35;
		}

		.editor-host {
			position: relative;
			flex: 1;
			min-height: 0;
		}

		:global(.editor-host .cm-scroller) {
			scrollbar-width: thin;
			scrollbar-color: rgba(140, 160, 255, 0.18) transparent;
		}

		:global(.editor-host .cm-scroller::-webkit-scrollbar) {
			width: 6px;
			height: 6px;
		}

		:global(.editor-host .cm-scroller::-webkit-scrollbar-track) {
			background: transparent;
		}

		:global(.editor-host .cm-scroller::-webkit-scrollbar-thumb) {
			background: rgba(140, 160, 255, 0.18);
			border-radius: 3px;
		}

		:global(.editor-host .cm-scroller::-webkit-scrollbar-thumb:hover) {
			background: rgba(140, 160, 255, 0.32);
		}

		:global(.editor-host .cm-scroller::-webkit-scrollbar-corner) {
			background: transparent;
		}

		.demo-grid:not(.ready) :global(.cm-editor) {
			opacity: 0;
		}

		@media (max-width: 980px) {
			.demo-grid {
				grid-template-columns: 1fr;
			}

			.panel {
				display: none;
			}

			.panel.is-active {
				display: flex;
			}

			.demo-toolbar {
				justify-content: flex-start;
			}

			.demo-status-row {
				align-items: start;
			}

			.panel-body {
				min-height: 20rem;
			}

			.mobile-pane-toggle {
				display: flex;
				position: sticky;
				bottom: 0;
				z-index: 5;
				justify-content: center;
				align-items: center;
				gap: 0.65rem;
				padding: 0.65rem 0.75rem 0.8rem;
				background: rgba(8, 14, 30, 0.96);
				border-top: 1px solid rgba(255, 255, 255, 0.08);
			}

			.pane-button {
				border: none;
				background: transparent;
				color: rgba(235, 240, 255, 0.65);
				font-size: 0.96rem;
				padding: 0.25rem 0.2rem;
				text-transform: lowercase;
			}

			.pane-button.is-active {
				color: #f2f5ff;
				font-weight: 500;
			}
		}

		@media (max-width: 720px) {
			.demo-shell {
				padding: 0;
			}
		}
	</style>
}
