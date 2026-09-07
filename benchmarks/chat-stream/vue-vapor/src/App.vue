<script setup vapor>
// Streaming-chat fixture (Vue Vapor 3.6) — shared DOM/API contract with the
// sibling apps (see ../../README.md). Same immutable streaming model over
// shallowRefs; Vue flushes on a microtask with no public sync flush, so the
// harness awaits `window.__benchFlush` (see ./main.js) after every pump/
// interaction — `__pump` returns the remaining count computed from the state
// it just set, so draining works without awaiting inside the app.
import { ref, shallowRef, computed } from 'vue';
import { initialConversations, nextReply, userMessage, segText } from './data.js';

const convs = shallowRef(initialConversations());
const active = ref(0);
const draft = ref('');
const streamingId = ref(null);

function send() {
	const text = draft.value.trim();
	if (text === '') return;
	const reply = nextReply();
	convs.value = convs.value.map((c, i) =>
		i === active.value ? { ...c, messages: [...c.messages, userMessage(text), reply] } : c,
	);
	streamingId.value = reply.id;
	draft.value = '';
}

window.__pump = (k) => {
	const sid = streamingId.value;
	if (sid === null) return 0;
	const msg = convs.value[active.value].messages.find((m) => m.id === sid);
	if (msg === undefined) return 0;
	const done = Math.min(msg.total, msg.done + k);
	convs.value = convs.value.map((c, i) =>
		i === active.value
			? { ...c, messages: c.messages.map((m) => (m.id === sid ? { ...m, done } : m)) }
			: c,
	);
	if (done === msg.total) streamingId.value = null;
	return msg.total - done;
};
window.__reset = () => {
	convs.value = initialConversations();
	active.value = 0;
	draft.value = '';
	streamingId.value = null;
};

const conv = computed(() => convs.value[active.value]);
</script>

<template>
	<div class="chatapp">
		<header class="topbar">
			<h1>chat</h1>
			<nav class="tabs">
				<button
					v-for="c of convs"
					:key="c.id"
					:class="c.id === active ? 'conv-tab active' : 'conv-tab'"
					:data-conv="'' + c.id"
					@click="active = c.id"
				>
					{{ c.title }}
				</button>
			</nav>
		</header>
		<main class="messages">
			<div
				v-for="m of conv.messages"
				:key="m.id"
				:class="'message ' + m.role + (m.id === streamingId ? ' streaming' : '')"
			>
				<div class="bubble">
					<template v-for="s of m.segments" :key="s.id">
						<pre v-if="s.type === 'code'" class="code"><code>{{ segText(s, m.done) }}</code></pre>
						<p v-else class="text">{{ segText(s, m.done) }}</p>
					</template>
				</div>
			</div>
		</main>
		<footer class="composer">
			<input
				class="prompt"
				placeholder="Message…"
				:value="draft"
				@input="draft = $event.target.value"
				@keydown.enter="send"
			/>
			<button class="send" @click="send">Send</button>
		</footer>
	</div>
</template>
