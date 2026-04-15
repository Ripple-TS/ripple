/**
@import { Block, TryBlock, TryBlockWithCatch } from '#server';
@import { OutputInterface } from './index.js';
 */

/**
@typedef {Error} SSRError
@typedef {(__output: OutputInterface) => void} BlockFunction
@typedef {() => void} TryFunction
@typedef {(error: SSRError) => void} CatchFunction
@typedef {() => void} PendingFunction
 */

import { ASYNC_DERIVED_READ_THROWN } from '../client/constants.js';
import {
	TRY_CATCH_BLOCK,
	TRY_PENDING_BLOCK,
	REGULAR_BLOCK,
	COMPONENT_BLOCK,
	ROOT_BLOCK,
	CAUGHT_ERROR,
} from './constants.js';
import { run_block, active_block, active_component, Output, set_active_block } from './index.js';

/**
 * @param {number} flags
 * @param {BlockFunction} fn
 * @param {any} [state]
 * @param {boolean} [skip_run]
 * @returns {Block}
 */
function block(flags, fn, state, skip_run = false) {
	/** @type {Block} */
	var block = {
		co: active_component,
		f: active_block ? flags : flags | ROOT_BLOCK,
		fn,
		o: active_block ? active_block.o.branch() : new Output(null),
		p: active_block,
		s: state,
		first: null,
		last: null,
		next: null,
		prev: null,
	};

	if (active_block) {
		push_block(block, active_block);
	} else {
		set_active_block(block);
	}

	if (!skip_run) {
		run_block(block);
	}

	return block;
}

/**
 * @param {TryFunction} try_fn
 * @param {CatchFunction | null} catch_fn
 * @param {PendingFunction | null} pending_fn
 * @returns {TryBlock}
 */
export function try_block(try_fn, catch_fn = null, pending_fn = null) {
	if (!pending_fn && !catch_fn) {
		throw new Error('try_block must have either pending or catch state');
	}
	var flags =
		pending_fn && catch_fn
			? TRY_PENDING_BLOCK | TRY_CATCH_BLOCK
			: catch_fn
				? TRY_CATCH_BLOCK
				: TRY_PENDING_BLOCK;

	var created_block = block(flags, try_fn, { p: pending_fn, c: catch_fn }, true);
	var previous_block = /** @type {Block} */ (active_block);
	set_active_block(created_block);

	try {
		try_fn();
	} catch (error) {
		if (error === ASYNC_DERIVED_READ_THROWN && created_block.f & TRY_PENDING_BLOCK) {
			// we should only end up here in the streaming mode during the sync phase
			created_block.o.clear();
			pending_fn?.();
			// continue processing other try blocks
			return created_block;
		}

		if (created_block.f & TRY_CATCH_BLOCK) {
			created_block.o.clear();
			cancel_async_operations(created_block);
			// render the catch
			catch_fn?.(/** @type {SSRError} */ (error));
		} else {
			// no catch handler, re-throw for an outer boundary to handle
			throw error;
		}
	} finally {
		set_active_block(previous_block);
	}

	return created_block;
}

/**
 * @param {BlockFunction} fn
 * @returns {Block}
 */
export function regular_block(fn) {
	return block(REGULAR_BLOCK, fn);
}

/**
 * @param {BlockFunction} fn
 * @returns {Block}
 */
export function component_block(fn) {
	return block(COMPONENT_BLOCK, fn, null, true);
}

/**
 * @param {Block} block
 * @returns {TryBlockWithCatch}
 */
export function get_closest_catch_block(block) {
	var current = block;

	while (current !== null) {
		// there should always be a catch block since we always start with try/catch when rendering
		if (current.f & TRY_CATCH_BLOCK) {
			return current;
		}
		// we always start with a root block that has the try/catch flag,
		// so we should never get to null
		current = /** @type {Block} */ (current.p);
	}

	throw new Error('No catch block found');
}

/**
 * @param {Block | null} block
 * @returns {void}
 */
export function cancel_async_operations(block) {
	if (block === null) {
		return;
	}

	if (block.f & TRY_CATCH_BLOCK) {
		if (block.f & CAUGHT_ERROR) {
			// already handling an error — skip
			return;
		}

		block.o.cancelAsyncOperations();
		block.f |= CAUGHT_ERROR;
	}

	var child = block.first;
	while (child !== null) {
		cancel_async_operations(child);
		child = child.next;
	}
}

/**
 * @param {Block} block
 * @param {Block} parent_block
 */
function push_block(block, parent_block) {
	var parent_last = parent_block.last;
	if (parent_last === null) {
		parent_block.last = parent_block.first = block;
	} else {
		parent_last.next = block;
		block.prev = parent_last;
		parent_block.last = block;
	}
}
