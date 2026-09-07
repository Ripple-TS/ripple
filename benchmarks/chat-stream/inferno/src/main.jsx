import { Component, render, rerender } from 'inferno';
import { initialConversations, nextReply, userMessage, segText } from './data.js';

// Native Inferno streaming-chat fixture — shared DOM/API contract with the sibling
// apps (see ../../README.md). Same immutable streaming model: the streaming
// message is replaced with an advanced `done` per `window.__pump(k)`; state
// class updates are explicitly drained so the harness's timed window captures the work.

// Keep benchmark instrumentation outside the component body so the harness
// receives stable entry points into the current class instance.
function exposeBenchmarkHook(name, handler) {
	window[name] = (...args) => {
		const result = handler(...args);
		rerender();
		return result;
	};
}

class ChatApp extends Component {
	constructor(props) {
		super(props);
		this.state = { convs: initialConversations(), active: 0, draft: '', streamingId: null };
		exposeBenchmarkHook('__pump', this.pump);
		exposeBenchmarkHook('__reset', this.reset);
	}

	send = () => {
		const text = this.state.draft.trim();
		if (text === '') return;
		const reply = nextReply();
		this.setState(({ convs, active }) => ({
			convs: convs.map((conversation, index) =>
				index === active
					? { ...conversation, messages: [...conversation.messages, userMessage(text), reply] }
					: conversation,
			),
			draft: '',
			streamingId: reply.id,
		}));
	};

	pump = (k) => {
		const { convs, active, streamingId } = this.state;
		if (streamingId === null) return 0;
		const msg = convs[active].messages.find((m) => m.id === streamingId);
		if (msg === undefined) return 0;
		const done = Math.min(msg.total, msg.done + k);
		this.setState({
			convs: convs.map((conversation, index) =>
				index === active
					? {
							...conversation,
							messages: conversation.messages.map((message) =>
								message.id === streamingId ? { ...message, done } : message,
							),
						}
					: conversation,
			),
			streamingId: done === msg.total ? null : streamingId,
		});
		return msg.total - done;
	};

	reset = () =>
		this.setState({ convs: initialConversations(), active: 0, draft: '', streamingId: null });

	render() {
		const { convs, active, draft, streamingId } = this.state;
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
								onClick={() => this.setState({ active: c.id })}
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
						onInput={(e) => this.setState({ draft: e.target.value })}
						onKeyDown={(e) => {
							if (e.key === 'Enter') this.send();
						}}
					/>
					<button className="send" onClick={this.send}>
						Send
					</button>
				</footer>
			</div>
		);
	}
}

render(<ChatApp />, document.getElementById('main'));
