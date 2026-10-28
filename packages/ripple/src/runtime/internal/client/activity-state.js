/** @import { Block, UserEffectState } from '#client' */
import { EFFECT_BLOCK, PAUSED } from './constants.js';

/** @type {((block: Block) => void) | null} */
export let after_activity_update = null;

/** @param {(block: Block) => void} update */
export function observe_activity_updates(update) {
	after_activity_update = update;
}

/** @param {Block | null} block */
export function activity_hidden(block) {
	for (; block !== null; block = block.p) {
		if (block.s?.activity === true && block.s.hidden) return true;
	}
	return false;
}

/** @type {((element: Element, update: () => void) => void) | null} */
export let activity_style = null;
/** @param {NonNullable<typeof activity_style>} update */
export function observe_activity_styles(update) {
	activity_style = update;
}

/** @param {Block} block @returns {UserEffectState | null} */
export function user_effect_state(block) {
	return (block.f & EFFECT_BLOCK) !== 0 && block.s?.u === true ? block.s : null;
}

/** @param {Block} block */
export function pause_activity_effect(block) {
	var state = /** @type {UserEffectState} */ (user_effect_state(block));
	if (!state.r) {
		state.p = (block.f & PAUSED) !== 0;
		for (var parent = block.p; !state.p && parent !== null; parent = parent.p) {
			if ((parent.f & PAUSED) !== 0 && !(user_effect_state(parent)?.r && activity_hidden(parent)))
				state.p = true;
		}
	}
	state.r = true;
	block.f |= PAUSED;
}

/** @param {Block} block @returns {boolean} */
export function resume_activity_effect(block) {
	var state = user_effect_state(block);
	if (state === null || !state.r || activity_hidden(block)) return false;
	if (!state.p) block.f &= ~PAUSED;
	return true;
}

/** @param {Block} block @returns {boolean} whether Activity still owns the pause */
export function resume_async_effect(block) {
	var state = user_effect_state(block);
	if (state === null) return false;
	state.p = false;
	return state.r && activity_hidden(block);
}

/** @param {Block} block */
export function activity_needs_run(block) {
	return user_effect_state(block)?.r === true;
}

/** Clear only immediately before an eligible execution, never on enqueue. @param {Block} block */
export function consume_activity_run(block) {
	var state = user_effect_state(block);
	if (state !== null) state.r = false;
}

/** @type {((start: Comment, end: Comment) => void) | null} */
export let restore_activity_range = null;
/** @param {NonNullable<typeof restore_activity_range>} restore */
export function set_activity_restorer(restore) {
	restore_activity_range = restore;
}
