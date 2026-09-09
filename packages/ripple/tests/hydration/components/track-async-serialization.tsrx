import { track, trackAsync } from 'ripple';
import { Money } from '../fixtures/money.js';

export const transport = {
	Money: {
		encode: (value: unknown) => value instanceof Money && [value.amount, value.currency],
		decode: ([amount, currency]: [number, string]) => new Money(amount, currency),
	},
};

module server {
	import { Money } from '../fixtures/money.js';

	export async function formatValue(n: number): Promise<string> {
		return `server-${n}`;
	}

	export async function doubleMoney(value: Money): Promise<Money> {
		if (!(value instanceof Money)) throw new Error('RPC argument was not revived');
		return new Money(value.amount * 2, value.currency);
	}
}

import { doubleMoney, formatValue } from server;

function MoneyResult({ count }: { count: { value: number } }) @{
	let &[money] = trackAsync(() => doubleMoney(new Money(count.value, 'USD')));
	<p class="result">{money.format()}</p>
}

export function AsyncCustomType() @{
	let &[count, count_ref] = track(6);
	<>
		<button
			class="increment"
			onClick={() => {
				count++;
			}}
		>{'increment'}</button>
		@try {
			<MoneyResult count={count_ref} />
		} @pending {
			<p class="loading">{'loading...'}</p>
		}
	</>
}

function ServerCallResult({ count }: { count: { value: number } }) @{
	let &[data] = trackAsync(() => formatValue(count.value));
	<p class="result">{data}</p>
}

export function AsyncWithServerCall() @{
	let &[count, count_ref] = track(0);
	<>
		<button
			class="increment"
			onClick={() => {
				count++;
			}}
		>{'increment'}</button>
		@try {
			<ServerCallResult count={count_ref} />
		} @pending {
			<p class="loading">{'loading...'}</p>
		}
	</>
}

export function AsyncSimpleValue() @{
	@try {
		let &[data] = trackAsync(() => Promise.resolve('hydrated value'));
		<p class="result">{data}</p>
	} @pending {
		<p class="loading">{'loading...'}</p>
	}
}

export function AsyncNumericValue() @{
	@try {
		let &[count] = trackAsync(() => Promise.resolve(42));
		<span class="count">{count}</span>
	} @pending {
		<span class="pending">{'...'}</span>
	}
}

export function AsyncObjectValue() @{
	@try {
		let &[user] = trackAsync(() => Promise.resolve({ name: 'Alice', age: 30 }));
		<div class="user">
			<span class="name">{user.name}</span>
			<span class="age">{user.age}</span>
		</div>
	} @pending {
		<div class="loading">{'loading user...'}</div>
	}
}

export function AsyncMultipleValues() @{
	@try {
		let &[first] = trackAsync(() => Promise.resolve('alpha'));
		let &[second] = trackAsync(() => Promise.resolve('beta'));
		<div class="multi">
			<span class="first">{first}</span>
			<span class="second">{second}</span>
		</div>
	} @pending {
		<div class="loading">{'loading...'}</div>
	}
}

export function AsyncWithCatch() @{
	@try {
		let &[data] = trackAsync(() => Promise.reject(new Error('fetch failed')));
		<p class="result">{data}</p>
	} @pending {
		<p class="loading">{'loading...'}</p>
	} @catch (e) {
		<p class="error">{(e as Error).message}</p>
	}
}

export function ChildWithError() @{
	@try {
		let &[data] = trackAsync(() => Promise.reject(new Error('child error')));
		<p class="result">{data}</p>
	} @pending {
		<p class="pending">{'loading...'}</p>
	}
}

export function ParentWithCatch() @{
	@try {
		<ChildWithError />
	} @catch (e) {
		<p class="parent-error">{(e as Error).message}</p>
	}
}

function ReactiveDependencyResult({ count }: { count: { value: number } }) @{
	let &[data] = trackAsync(() => Promise.resolve(`count-${count.value}`));
	<p class="result">{data}</p>
}

export function AsyncWithReactiveDependency() @{
	let &[count, count_ref] = track(0);
	<>
		<button
			class="increment"
			onClick={() => {
				count++;
			}}
		>{'increment'}</button>
		@try {
			<ReactiveDependencyResult count={count_ref} />
		} @pending {
			<p class="loading">{'loading...'}</p>
		}
	</>
}
