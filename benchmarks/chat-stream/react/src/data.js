// Deterministic chat corpus — IDENTICAL in every framework app (this file is
// copied verbatim into each app's src/). Everything derives from one fixed
// mulberry32 seed at module load, so every column streams byte-identical
// conversations in byte-identical token chunks: "predefined chat streams" with
// no fixture JSON to ship.
//
// Shapes:
//   conversation 0 — a 10-message chat history (short user prompts, LONG
//     assistant replies with mixed text/code segments), fully revealed.
//   conversation 1 — 200 short alternating messages: the long-history list for
//     the append/switch ops.
//   SCRIPTED_REPLIES — 8 long assistant replies (2–4 segments, ~200–500 tokens)
//     cycled by successive sends; `nextReply()` hands out the next one.
//
// A message is { id, role: 'user'|'assistant', segments, total, done }:
//   segments — [{ id, type: 'text'|'code', tokens: string[], start }] where
//     `start` is the segment's cumulative token offset;
//   total    — token count across segments;
//   done     — how many tokens are revealed (streaming progress; done === total
//     for settled messages). `segText(seg, done)` derives a segment's visible
//     string — shared by every app so the per-pump derivation cost is
//     identical app code everywhere.

function mulberry32(seed) {
	return () => {
		seed |= 0;
		seed = (seed + 1831565813) | 0;
		let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

const rand = mulberry32(20260710);
const pick = (arr) => arr[(rand() * arr.length) | 0];
const between = (lo, hi) => lo + ((rand() * (hi - lo + 1)) | 0);

const WORDS = (
	'the quick model streams tokens into view while layout keeps pace and state ' +
	'updates flow through the scheduler batching commits per chunk rendering text ' +
	'nodes growing lists keyed bubbles remain stable under sustained append load ' +
	'because reconciliation only touches the tail'
).split(' ');

const CODE_LINES = [
	'const stream = await client.chat({ model, messages });',
	'for await (const chunk of stream) {',
	'\tbuffer += chunk.delta;',
	'\trender(buffer);',
	'}',
	'export function tokenize(text) {',
	'\treturn text.split(/(?<=\\s)/);',
	'}',
	'if (done) return flush();',
	'const view = messages.map(toBubble);',
];

let tokenIdSeq = 1;

function textTokens(count) {
	const out = new Array(count);
	for (let i = 0; i < count; i++) out[i] = pick(WORDS) + ' ';
	return out;
}

// Code segments stream line-fragments: each line contributes a few tokens plus
// its newline, so a growing <code> gets realistic multi-line content.
function codeTokens(approx) {
	const out = [];
	while (out.length < approx) {
		const line = pick(CODE_LINES);
		const parts = line.split(/(?<= )/);
		for (const p of parts) out.push(p);
		out.push('\n');
	}
	return out;
}

function makeSegments(specs) {
	const segments = [];
	let start = 0;
	for (const s of specs) {
		const tokens = s.type === 'code' ? codeTokens(s.n) : textTokens(s.n);
		segments.push({ id: tokenIdSeq++, type: s.type, tokens, start });
		start += tokens.length;
	}
	return { segments, total: start };
}

let msgIdSeq = 1;

function message(role, specs, revealed) {
	const { segments, total } = makeSegments(specs);
	return { id: msgIdSeq++, role, segments, total, done: revealed ? total : 0 };
}

function shortText(lo, hi) {
	return [{ type: 'text', n: between(lo, hi) }];
}

function replySpecs() {
	const n = between(2, 4);
	const specs = [];
	for (let i = 0; i < n; i++) {
		specs.push(
			rand() < 0.3 ? { type: 'code', n: between(30, 80) } : { type: 'text', n: between(60, 160) },
		);
	}
	return specs;
}

// 8 long scripted replies, cycled by sends (deterministic sequence).
export const SCRIPTED_REPLIES = Array.from({ length: 8 }, () => {
	const { segments, total } = makeSegments(replySpecs());
	return { segments, total };
});

let replyCursor = 0;
export function nextReply() {
	const r = SCRIPTED_REPLIES[replyCursor++ % SCRIPTED_REPLIES.length];
	// Fresh message identity per send; segments are shared corpus data (apps
	// never mutate them — progress lives on the message).
	return { id: msgIdSeq++, role: 'assistant', segments: r.segments, total: r.total, done: 0 };
}

export function userMessage(text) {
	return {
		id: msgIdSeq++,
		role: 'user',
		segments: [{ id: tokenIdSeq++, type: 'text', tokens: [text], start: 0 }],
		total: 1,
		done: 1,
	};
}

function buildConversations() {
	const conv0 = { id: 0, title: 'Streaming demo', messages: [] };
	for (let i = 0; i < 5; i++) {
		conv0.messages.push(message('user', shortText(4, 10), true));
		const r = SCRIPTED_REPLIES[i % SCRIPTED_REPLIES.length];
		conv0.messages.push({
			id: msgIdSeq++,
			role: 'assistant',
			segments: r.segments,
			total: r.total,
			done: r.total,
		});
	}
	const conv1 = { id: 1, title: 'Long history', messages: [] };
	for (let i = 0; i < 100; i++) {
		conv1.messages.push(message('user', shortText(4, 12), true));
		conv1.messages.push(message('assistant', shortText(8, 24), true));
	}
	return [conv0, conv1];
}

const PRISTINE = buildConversations();

// Fresh deep-enough copies for `__reset()`: message objects are replaced
// during streaming (immutable updates), so reset hands out new message arrays
// with the ORIGINAL settled message objects (never mutated) + reset cursors.
export function initialConversations() {
	replyCursor = 0;
	return PRISTINE.map((c) => ({ ...c, messages: [...c.messages] }));
}

/** Visible string of a segment at `done` revealed tokens (message-level). */
export function segText(seg, done) {
	const visible = Math.max(0, Math.min(seg.tokens.length, done - seg.start));
	if (visible === 0) return '';
	if (visible === seg.tokens.length) {
		// Settled segments cache their joined text on the corpus object — every
		// app hits this identically once a segment fully reveals.
		return (seg._full ??= seg.tokens.join(''));
	}
	return seg.tokens.slice(0, visible).join('');
}
