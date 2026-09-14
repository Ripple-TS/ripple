import { track, flushSync } from 'ripple';
import { initialConversations, nextReply, userMessage, segText } from './data.js';

// Streaming-chat fixture (Ripple) — shared DOM/API contract with the sibling
// apps (see ../../README.md). Same immutable streaming model over tracked
// bindings; deriveds are FUNCTIONS called in template expressions (fine-
// grained: the body runs once — the TodoMVC column's finding), and every
// mutation wraps in flushSync so the commit lands in the timed window.

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

export default function ChatApp() @{
	const convs = track<Conversation[]>(initialConversations());
	const active = track(0);
	const draft = track('');
	const streamingId = track<number | null>(null);

	const send = () => {
		const text = draft.value.trim();
		if (text === '') return;
		const reply = nextReply();
		flushSync(() => {
			convs.value = convs.value.map(
				(c, i) => i === active.value
					? { ...c, messages: [...c.messages, userMessage(text), reply] }
					: c,
			);
			streamingId.value = reply.id;
			draft.value = '';
		});
	};

	(window as any).__pump = (k: number) => {
		const sid = streamingId.value;
		if (sid === null) return 0;
		const msg = convs.value[active.value].messages.find((m) => m.id === sid);
		if (msg === undefined) return 0;
		const done = Math.min(msg.total, msg.done + k);
		flushSync(() => {
			convs.value = convs.value.map(
				(c, i) => i === active.value
					? { ...c, messages: c.messages.map((m) => (m.id === sid ? { ...m, done } : m)) }
					: c,
			);
			if (done === msg.total) streamingId.value = null;
		});
		return msg.total - done;
	};
	(window as any).__reset = () => flushSync(() => {
		convs.value = initialConversations();
		active.value = 0;
		draft.value = '';
		streamingId.value = null;
	});

	const conv = () => convs.value[active.value];

	<div class="chatapp">
		<header class="topbar">
			<h1>{'chat'}</h1>
			<nav class="tabs">
				@for (const c of convs.value; key c.id) {
					<button
						class={c.id === active.value ? 'conv-tab active' : 'conv-tab'}
						data-conv={'' + c.id}
						onClick={() => flushSync(() => {
							active.value = c.id;
						})}
					>{c.title}</button>
				}
			</nav>
		</header>
		<main class="messages">
			@for (const m of conv().messages; key m.id) {
				<div class={'message ' + m.role + (m.id === streamingId.value ? ' streaming' : '')}>
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
				value={draft.value}
				onInput={(e: Event) => flushSync(() => {
					draft.value = (e.target as HTMLInputElement).value;
				})}
				onKeyDown={(e: KeyboardEvent) => {
					if (e.key === 'Enter') send();
				}}
			/>
			<button class="send" onClick={send}>{'Send'}</button>
		</footer>
	</div>
}
