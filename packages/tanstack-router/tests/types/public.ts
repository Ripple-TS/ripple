import {
	createControlledPromise,
	createMemoryHistory,
	isNotFound,
	notFound,
	type ControlledPromise,
	type RouterHistory,
} from '@ripple-ts/tanstack-router';
import { Probe } from '../fixtures/source-library/index.js';
import type { Component } from 'ripple';

const history: RouterHistory = createMemoryHistory({ initialEntries: ['/'] });
history.push('/next');
const promise: ControlledPromise<number> = createControlledPromise<number>();
promise.resolve(1);
// @ts-expect-error A controlled promise retains its result type.
promise.resolve('1');
// @ts-expect-error History destinations must be strings.
history.push(1);
const component: Component<{ onDispose?: () => void }> = Probe;
void component;
if (isNotFound(notFound({ data: { reason: 'missing' } }))) history.destroy();
