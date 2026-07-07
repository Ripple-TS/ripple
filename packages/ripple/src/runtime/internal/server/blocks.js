/**
 * @import { Block, TryBlock, TryBlockWithCatch } from '#server';
 * @import { OutputInterface } from './index.js';
 */

/** @typedef {Error} SSRError */
/** @typedef {(__output: OutputInterface) => void} BlockFunction */
/** @typedef {() => void} TryFunction */
/** @typedef {(error: SSRError) => void} CatchFunction */
/** @typedef {() => void} PendingFunction */

import { ASYNC_DERIVED_READ_THROWN } from '../client/constants.js';
import {
	TRY_CATCH_BLOCK,
	TRY_PENDING_BLOCK,
	TRY_BLOCK,
	REGULAR_BLOCK,
	COMPONENT_BLOCK,
	ROOT_BLOCK,
	CAUGHT_ERROR,
} from './constants.js';
import {
	run_block,
	active_block,
	active_component,
	Output,
	set_active_block,
	TrackAsyncRunError,
	create_public_track_async_error,
	serialize_track_async_error,
	begin_stream_unit,
} from './index.js';

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

		if (created_block.o.isStreamMode() && created_block.o.hasPendingAsyncOperations()) {
			// the body suspended: turn this boundary into a streaming flush unit —
			// the partially-rendered body is kept (async re-runs fill its holes in
			// place) and the live slot gets the wrapper markers plus the pending
			// fallback (nothing, for catch-only boundaries)
			begin_stream_unit(created_block, pending_fn);
		}
	} catch (error) {
		set_active_block(created_block);
		if (error === ASYNC_DERIVED_READ_THROWN) {
			// pending reads inside blocks are swallowed by run_block (they
			// register a re-run); a sentinel escaping to here means a read
			// happened outside any block — let an outer boundary deal with it
			throw error;
		}

		if (created_block.f & TRY_CATCH_BLOCK) {
			created_block.o.clear();
			cancel_async_operations(created_block);

			// make sure to serialize trackAsync error so the client can hydrate them properly
			// needs to happen after clearing output
			if (error instanceof TrackAsyncRunError) {
				var { tracked: t, cause } = /** @type {InstanceType<typeof TrackAsyncRunError>} */ (error);
				var public_error = create_public_track_async_error(cause);
				catch_fn?.(public_error);
				serialize_track_async_error(t.h, public_error);
				return created_block;
			}

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
 * Nearest try boundary (pending or catch) — async work is accounted on it,
 * and in stream mode it is the boundary that becomes a flush unit.
 * @param {Block} block
 * @returns {TryBlock}
 */
export function get_closest_try_block(block) {
	var current = block;

	while (current !== null) {
		if (current.f & TRY_BLOCK) {
			return /** @type {TryBlock} */ (current);
		}
		// the root block always carries try flags, so we never reach null
		current = /** @type {Block} */ (current.p);
	}

	throw new Error('No try block found');
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
 * Cancels outstanding async work below an error boundary. Descendant try
 * boundaries (`is_descendant`) additionally abandon their streaming flush
 * units — their regions get replaced by the boundary's catch content, so
 * they must never stream a stale chunk.
 * @param {Block | null} block
 * @param {boolean} [is_descendant=false]
 * @returns {void}
 */
export function cancel_async_operations(block, is_descendant = false) {
	if (block === null) {
		return;
	}

	if (block.f & TRY_BLOCK) {
		if (block.f & CAUGHT_ERROR) {
			// already handling an error — skip
			return;
		}

		block.o.cancelAsyncOperations();
		block.f |= CAUGHT_ERROR;

		if (is_descendant) {
			block.o.abandonUnit();
		}
	}

	var child = block.first;
	while (child !== null) {
		cancel_async_operations(child, true);
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
