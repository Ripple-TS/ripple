import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { initialConversations, nextReply, userMessage, segText } from './data.js';

// Streaming-chat fixture (React 19) — shared DOM/API contract with the sibling
// apps (see ../../README.md). Same immutable streaming model: the streaming
// message is replaced with an advanced `done` per `window.__pump(k)`; state
// updates flush synchronously (flushSync) so the harness's timed window
// captures the commit.

// Keep benchmark instrumentation outside the component body so React Compiler
// can optimize the component while the harness still receives current handlers.
function exposeBenchmarkHook(name, handler) {
	window[name] = handler;
}

function ChatApp() {
	const [convs, setConvs] = useState(initialConversations);
	const [active, setActive] = useState(0);
	const [draft, setDraft] = useState('');
	const [streamingId, setStreamingId] = useState(null);

	const send = () => {
		const text = draft.trim();
		if (text === '') return;
		const reply = nextReply();
		flushSync(() => {
			setConvs((cs) =>
				cs.map((c, i) =>
					i === active ? { ...c, messages: [...c.messages, userMessage(text), reply] } : c,
				),
			);
			setStreamingId(reply.id);
			setDraft('');
		});
	};

	exposeBenchmarkHook('__pump', (k) => {
		if (streamingId === null) return 0;
		const msg = convs[active].messages.find((m) => m.id === streamingId);
		if (msg === undefined) return 0;
		const done = Math.min(msg.total, msg.done + k);
		flushSync(() => {
			setConvs(
				convs.map((c, i) =>
					i === active
						? { ...c, messages: c.messages.map((m) => (m.id === streamingId ? { ...m, done } : m)) }
						: c,
				),
			);
			if (done === msg.total) setStreamingId(null);
		});
		return msg.total - done;
	});
	exposeBenchmarkHook('__reset', () =>
		flushSync(() => {
			setConvs(initialConversations());
			setActive(0);
			setDraft('');
			setStreamingId(null);
		}),
	);

	const conv = convs[active];

	return (
		<div className="chatapp">
			<header className="topbar">
				<h1>chat</h1>
				<nav className="tabs">
					{convs.map((c) => (
						<button
							key={c.id}
							className={'conv-tab' + (c.id === active ? ' active' : '')}
							data-conv={'' + c.id}
							onClick={() => flushSync(() => setActive(c.id))}
						>
							{c.title}
						</button>
					))}
				</nav>
			</header>
			<main className="messages">
				{conv.messages.map((m) => (
					<div
						key={m.id}
						className={'message ' + m.role + (m.id === streamingId ? ' streaming' : '')}
					>
						<div className="bubble">
							{m.segments.map((s) =>
								s.type === 'code' ? (
									<pre key={s.id} className="code">
										<code>{segText(s, m.done)}</code>
									</pre>
								) : (
									<p key={s.id} className="text">
										{segText(s, m.done)}
									</p>
								),
							)}
						</div>
					</div>
				))}
			</main>
			<footer className="composer">
				<input
					className="prompt"
					placeholder="Message…"
					value={draft}
					onInput={(e) => flushSync(() => setDraft(e.target.value))}
					onKeyDown={(e) => {
						if (e.key === 'Enter') send();
					}}
				/>
				<button className="send" onClick={send}>
					Send
				</button>
			</footer>
		</div>
	);
}

createRoot(document.getElementById('main')).render(<ChatApp />);
