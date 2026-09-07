import { useState, flushSync } from 'octane';
import { initialConversations, nextReply, userMessage, segText } from './data.js';

// Streaming-chat fixture (octane .tsrx) — a ChatGPT/Claude-style interface:
// conversation tabs, a keyed message list of role bubbles with mixed text/code
// segments, a CONTROLLED composer, and a streaming assistant reply driven by
// the harness through `window.__pump(k)` (token arrival is a network event,
// not user input — the ONE programmatic hook, plus `__reset()` for sample
// isolation; see ../../README.md for the shared DOM/API contract).
//
// Streaming state model (identical in every column): the streaming message is
// REPLACED immutably with an advanced `done` counter per pump; segment text
// derives via the shared `segText`. Frameworks differ only in their idiomatic
// reactivity around that model.

interface Segment {
	id: number;
	type: string;
	tokens: string[];
	start: number;
}
interface Message {
	id: number;
	role: string;
	segments: Segment[];
	total: number;
	done: number;
}
interface Conversation {
	id: number;
	title: string;
	messages: Message[];
}

export function ChatApp() @{
	const [convs, setConvs] = useState<Conversation[]>(initialConversations);
	const [active, setActive] = useState(0);
	const [draft, setDraft] = useState('');
	const [streamingId, setStreamingId] = useState<number | null>(null);

	const send = () => {
		const text = draft.trim();
		if (text === '') return;
		const reply = nextReply();
		setConvs(
			(cs) => cs.map(
				(c, i) => i === active ? { ...c, messages: [...c.messages, userMessage(text), reply] } : c,
			),
		);
		setStreamingId(reply.id);
		setDraft('');
	};

	// Advance the streaming reply by k tokens; returns remaining (0 = settled).
	// Derives the next value from THIS render's closure state (each pump commits
	// synchronously, so the next pump sees a fresh closure) — a functional
	// updater would run at render time, after this function must return.
	(window as any).__pump = (k: number) => {
		if (streamingId === null) return 0;
		const msg = convs[active].messages.find((m) => m.id === streamingId);
		if (msg === undefined) return 0;
		const done = Math.min(msg.total, msg.done + k);
		// Not an event handler — commit synchronously so the harness's timed
		// window captures the render (octane otherwise flushes on a microtask).
		flushSync(() => {
			setConvs(
				convs.map(
					(c, i) => i === active
						? { ...c, messages: c.messages.map((m) => (m.id === streamingId ? { ...m, done } : m)) }
						: c,
				),
			);
			if (done === msg.total) setStreamingId(null);
		});
		return msg.total - done;
	};
	(window as any).__reset = () => flushSync(() => {
		setConvs(initialConversations());
		setActive(0);
		setDraft('');
		setStreamingId(null);
	});

	const conv = convs[active];

	<div class="chatapp">
		<header class="topbar">
			<h1>chat</h1>
			<nav class="tabs">
				@for (const c of convs; key c.id) {
					<button
						class={{ 'conv-tab': true, active: c.id === active }}
						data-conv={'' + c.id}
						onClick={() => setActive(c.id)}
					>{c.title as string}</button>
				}
			</nav>
		</header>
		<main class="messages">
			@for (const m of conv.messages; key m.id) {
				<div class={'message ' + m.role + (m.id === streamingId ? ' streaming' : '')}>
					<div class="bubble">
						@for (const s of m.segments; key s.id) {
							@if (s.type === 'code') {
								<pre class="code">
									<code>{segText(s, m.done) as string}</code>
								</pre>
							} @else {
								<p class="text">{segText(s, m.done) as string}</p>
							}
						}
					</div>
				</div>
			}
		</main>
		<footer class="composer">
			<input
				class="prompt"
				placeholder="Message…"
				value={draft}
				onInput={(e: Event) => setDraft((e.target as HTMLInputElement).value)}
				onKeyDown={(e: KeyboardEvent) => {
					if (e.key === 'Enter') send();
				}}
			/>
			<button class="send" onClick={send}>Send</button>
		</footer>
	</div>
}
