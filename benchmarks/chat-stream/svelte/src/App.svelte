<script>
	import { flushSync } from 'svelte';
	import { initialConversations, nextReply, segText, userMessage } from './data.js';

	// The corpus is immutable and replaced at message/conversation boundaries;
	// raw state avoids deep proxies while keyed each blocks preserve identity.
	let conversations = $state.raw(initialConversations());
	let active = $state(0);
	let draft = $state('');
	let streamingId = $state(null);
	let conversation = $derived(conversations[active]);

	function send() {
		const text = draft.trim();
		if (text === '') return;
		const reply = nextReply();
		flushSync(() => {
			conversations = conversations.map((item, index) =>
				index === active
					? { ...item, messages: [...item.messages, userMessage(text), reply] }
					: item,
			);
			streamingId = reply.id;
			draft = '';
		});
	}

	window.__pump = (count) => {
		if (streamingId === null) return 0;
		const message = conversations[active].messages.find((item) => item.id === streamingId);
		if (message === undefined) return 0;
		const done = Math.min(message.total, message.done + count);
		flushSync(() => {
			conversations = conversations.map((item, index) =>
				index === active
					? {
							...item,
							messages: item.messages.map((entry) =>
								entry.id === streamingId ? { ...entry, done } : entry,
							),
						}
					: item,
			);
			if (done === message.total) streamingId = null;
		});
		return message.total - done;
	};
	window.__reset = () => {
		flushSync(() => {
			conversations = initialConversations();
			active = 0;
			draft = '';
			streamingId = null;
		});
	};

	function selectConversation(id) {
		flushSync(() => {
			active = id;
		});
	}
	function updateDraft(event) {
		flushSync(() => {
			draft = event.currentTarget.value;
		});
	}
</script>

<div class="chatapp">
	<header class="topbar">
		<h1>chat</h1>
		<nav class="tabs">
			{#each conversations as item (item.id)}
				<button
					class:active={item.id === active}
					class="conv-tab"
					data-conv={String(item.id)}
					onclick={() => selectConversation(item.id)}>{item.title}</button
				>
			{/each}
		</nav>
	</header>
	<main class="messages">
		{#each conversation.messages as message (message.id)}
			<div class:streaming={message.id === streamingId} class="message {message.role}">
				<div class="bubble">
					{#each message.segments as segment (segment.id)}
						{#if segment.type === 'code'}
							<pre class="code"><code>{segText(segment, message.done)}</code></pre>
						{:else}
							<p class="text">{segText(segment, message.done)}</p>
						{/if}
					{/each}
				</div>
			</div>
		{/each}
	</main>
	<footer class="composer">
		<input
			class="prompt"
			placeholder="Message…"
			value={draft}
			oninput={updateDraft}
			onkeydown={(event) => {
				if (event.key === 'Enter') send();
			}}
		/>
		<button class="send" onclick={send}>Send</button>
	</footer>
</div>
