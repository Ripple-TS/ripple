import { createSignal, For, Show, flush } from 'solid-js';
import { render } from '@solidjs/web';
import { initialConversations, nextReply, userMessage, segText } from './data.js';

// Streaming-chat fixture (Solid 2.0) — shared DOM/API contract with the
// sibling apps (see ../../README.md). Same immutable streaming model over
// createSignal; `flush()` after every set commits inside the timed window.
// Class STRINGS throughout (the 2.0-beta's classList is inert — same finding
// as the TodoMVC column).

function ChatApp() {
	const [convs, setConvs] = createSignal(initialConversations());
	const [active, setActive] = createSignal(0);
	const [draft, setDraft] = createSignal('');
	const [streamingId, setStreamingId] = createSignal(null);

	const send = () => {
		const text = draft().trim();
		if (text === '') return;
		const reply = nextReply();
		setConvs((cs) =>
			cs.map((c, i) =>
				i === active() ? { ...c, messages: [...c.messages, userMessage(text), reply] } : c,
			),
		);
		setStreamingId(reply.id);
		setDraft('');
		flush();
	};

	window.__pump = (k) => {
		const sid = streamingId();
		if (sid === null) return 0;
		const msg = convs()[active()].messages.find((m) => m.id === sid);
		if (msg === undefined) return 0;
		const done = Math.min(msg.total, msg.done + k);
		setConvs((cs) =>
			cs.map((c, i) =>
				i === active()
					? { ...c, messages: c.messages.map((m) => (m.id === sid ? { ...m, done } : m)) }
					: c,
			),
		);
		if (done === msg.total) setStreamingId(null);
		flush();
		return msg.total - done;
	};
	window.__reset = () => {
		setConvs(initialConversations());
		setActive(0);
		setDraft('');
		setStreamingId(null);
		flush();
	};

	const conv = () => convs()[active()];

	return (
		<div class="chatapp">
			<header class="topbar">
				<h1>chat</h1>
				<nav class="tabs">
					<For each={convs()}>
						{(c) => (
							<button
								class={'conv-tab' + (c.id === active() ? ' active' : '')}
								data-conv={'' + c.id}
								onClick={() => {
									setActive(c.id);
									flush();
								}}
							>
								{c.title}
							</button>
						)}
					</For>
				</nav>
			</header>
			<main class="messages">
				<For each={conv().messages}>
					{(m) => (
						<div class={'message ' + m.role + (m.id === streamingId() ? ' streaming' : '')}>
							<div class="bubble">
								<For each={m.segments}>
									{(s) => (
										<Show
											when={s.type === 'code'}
											fallback={<p class="text">{segText(s, m.done)}</p>}
										>
											<pre class="code">
												<code>{segText(s, m.done)}</code>
											</pre>
										</Show>
									)}
								</For>
							</div>
						</div>
					)}
				</For>
			</main>
			<footer class="composer">
				<input
					class="prompt"
					placeholder="Message…"
					value={draft()}
					onInput={(e) => {
						setDraft(e.target.value);
						flush();
					}}
					onKeyDown={(e) => {
						if (e.key === 'Enter') send();
					}}
				/>
				<button class="send" onClick={send}>
					Send
				</button>
			</footer>
		</div>
	);
}

render(() => <ChatApp />, document.getElementById('main'));
