import { within } from '@testing-library/dom';
import { flushSync, hydrate, mount } from 'ripple';
import { vi } from 'vitest';

/** @type {Set<() => void>} */
const disposers = new Set();

/**
 * Each render owns its DOM, Ripple root, effects, and delegated listeners.
 * @param {import('ripple').Component} component
 * @param {{ props?: Record<string, any>, html?: string, beforeHydrate?: (container: HTMLDivElement) => void }} [options]
 */
export function render(component, { props, html, beforeHydrate } = {}) {
	const container = document.createElement('div');
	document.body.append(container);
	let dispose = () => {};
	const unmount = () => {
		if (!disposers.delete(unmount)) return;
		try {
			dispose();
		} finally {
			container.remove();
		}
	};
	disposers.add(unmount);
	try {
		if (html !== undefined) {
			container.innerHTML = html;
			beforeHydrate?.(container);
		}
		dispose = (html === undefined ? mount : hydrate)(component, { target: container, props });
		flushSync();
	} catch (error) {
		unmount();
		throw error;
	}
	return { container, unmount, ...within(container) };
}

export function cleanup() {
	const errors = [];
	for (const dispose of disposers) {
		try {
			dispose();
		} catch (error) {
			errors.push(error);
		}
	}
	if (errors.length) throw new AggregateError(errors, 'Router test cleanup failed');
}

/** Advance only the deadline requested by a test, then commit scheduled DOM work. */
export async function advanceTimers(milliseconds = 0) {
	await vi.advanceTimersByTimeAsync(milliseconds);
	flushSync();
}

export { fireEvent, waitFor } from '@testing-library/dom';
export { createControlledPromise } from '@ripple-ts/tanstack-router';
