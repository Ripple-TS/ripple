import type { Tracked } from 'ripple';
import { bindNode, bindValue, effect, track } from 'ripple';

import { DEFAULT_DEMO_SOURCE } from '../lib/demo.ts';

const MAX_SOURCE_LENGTH = 12000;
const DEBOUNCE_MS = 280;
const HASH_DEBOUNCE_MS = 400;
const TARGET_OPTIONS = [
	{ value: 'react', label: 'React' },
	{ value: 'ripple', label: 'Ripple' },
];
const TARGET_LABELS: Record<string, string> = {
	react: 'React output',
	ripple: 'Ripple output',
};

const VALID_TARGETS = new Set(TARGET_OPTIONS.map((o) => o.value));

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

	let selected_target: Tracked<string> = track(initial_hash?.target ?? 'react');

	let &[status] = track('Hydrating compiler...');
	let &[error_message] = track('');
	let &[last_updated] = track('');
	let &[editors_ready] = track(false);
	let latest_source = initial_hash?.source ?? DEFAULT_DEMO_SOURCE;
	let request_compile = () => {};

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
			window.clearTimeout(debounce_id);
			window.clearTimeout(hash_debounce_id);
			active_controller?.abort();
			source_view?.destroy();
			output_view?.destroy();
		};
	});

	effect(() => {
		selected_target.value;
		request_compile();
		const encoded = encode_hash(latest_source, selected_target.value);
		if (encoded) {
			history.replaceState(null, '', '#' + encoded);
		}
	});

	<section class="demo-shell" id="demo">
		<div class="demo-header">
			<div>
				<p class="demo-kicker">{'TSRX Playground'}</p>
			</div>
			<div class="demo-toolbar">
				<label class="target-picker">
					<select class="target-select" {ref bindValue(selected_target)}>
						for (const option of TARGET_OPTIONS) {
							<option value={option.value}>{option.label}</option>
						}
					</select>
				</label>
			</div>
		</div>

		if (error_message) {
			<div class="demo-error" role="alert">{error_message}</div>
		}

		<div class={`demo-grid${editors_ready ? ' ready' : ''}`}>
			<div class="panel panel-source">
				<div class="panel-topline">
					<span>{'TSRX input'}</span>
					<span>{'.tsrx'}</span>
				</div>
				<div class="panel-body editor-host" {ref bindNode(source_ref)} />
			</div>

			<div class="panel">
				<div class="panel-topline">
					<span>{TARGET_LABELS[selected_target.value]}</span>
				</div>
				<div class="panel-body editor-host" {ref bindNode(output_ref)} />
			</div>
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
			margin: 0;
			padding: 0 1rem 0.75rem;
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
			display: grid;
			gap: 0.85rem;
			justify-items: end;
		}

		.target-picker {
			display: grid;
			gap: 0.45rem;
			font-size: 0.84rem;
			color: rgba(26, 22, 64, 0.74);
		}

		.target-select {
			min-width: 10rem;
			padding: 0.7rem 0.85rem;
			border: none;
			background: rgba(255, 255, 255, 0.92);
			color: #1a1640;
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

		.demo-error {
			margin-bottom: 1rem;
			padding: 0.9rem 1rem;
			background: rgba(160, 54, 87, 0.18);
			color: #6f1d34;
		}

		.demo-grid {
			display: grid;
			grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
			gap: 0;
			flex: 1;
			min-height: 0;
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
			gap: 1rem;
			padding: 0.8rem 1rem;
			background: rgba(255, 255, 255, 0.03);
			font-size: 0.78rem;
			letter-spacing: 0.06em;
			text-transform: uppercase;
			color: rgba(214, 224, 255, 0.78);
		}

		.panel-body {
			flex: 1;
			min-height: 0;
		}

		.editor-host {
			position: relative;
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

			.demo-toolbar {
				justify-items: start;
			}

			.demo-status-row {
				align-items: start;
			}

			.panel-body {
				min-height: 20rem;
			}
		}

		@media (max-width: 720px) {
			.demo-shell {
				padding: 1rem;
			}
		}
	</style>
}
