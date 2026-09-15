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
	const money = trackAsync(() => doubleMoney(new Money(count.value, 'USD')));
	<p class="result">{money.value.format()}</p>
}

export function AsyncCustomType() @{
	const count = track(6);
	<>
		<button
			class="increment"
			onClick={() => {
				count.value++;
			}}
		>{'increment'}</button>
		@try {
			<MoneyResult {count} />
		} @pending {
			<p class="loading">{'loading...'}</p>
		}
	</>
}

function ServerCallResult({ count }: { count: { value: number } }) @{
	const data = trackAsync(() => formatValue(count.value));
	<p class="result">{data.value}</p>
}

export function AsyncWithServerCall() @{
	const count = track(0);
	<>
		<button
			class="increment"
			onClick={() => {
				count.value++;
			}}
		>{'increment'}</button>
		@try {
			<ServerCallResult {count} />
		} @pending {
			<p class="loading">{'loading...'}</p>
		}
	</>
}

export function AsyncSimpleValue() @{
	@try {
		const data = trackAsync(() => Promise.resolve('hydrated value'));
		<p class="result">{data.value}</p>
	} @pending {
		<p class="loading">{'loading...'}</p>
	}
}

export function AsyncNumericValue() @{
	@try {
		const count = trackAsync(() => Promise.resolve(42));
		<span class="count">{count.value}</span>
	} @pending {
		<span class="pending">{'...'}</span>
	}
}

export function AsyncObjectValue() @{
	@try {
		const user = trackAsync(() => Promise.resolve({ name: 'Alice', age: 30 }));
		<div class="user">
			<span class="name">{user.value.name}</span>
			<span class="age">{user.value.age}</span>
		</div>
	} @pending {
		<div class="loading">{'loading user...'}</div>
	}
}

export function AsyncMultipleValues() @{
	@try {
		const first = trackAsync(() => Promise.resolve('alpha'));
		const second = trackAsync(() => Promise.resolve('beta'));
		<div class="multi">
			<span class="first">{first.value}</span>
			<span class="second">{second.value}</span>
		</div>
	} @pending {
		<div class="loading">{'loading...'}</div>
	}
}

export function AsyncWithCatch() @{
	@try {
		const data = trackAsync(() => Promise.reject(new Error('fetch failed')));
		<p class="result">{data.value}</p>
	} @pending {
		<p class="loading">{'loading...'}</p>
	} @catch (e) {
		<p class="error">{(e as Error).message}</p>
	}
}

export function ChildWithError() @{
	@try {
		const data = trackAsync(() => Promise.reject(new Error('child error')));
		<p class="result">{data.value}</p>
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
	const data = trackAsync(() => Promise.resolve(`count-${count.value}`));
	<p class="result">{data.value}</p>
}

export function AsyncWithReactiveDependency() @{
	const count = track(0);
	<>
		<button
			class="increment"
			onClick={() => {
				count.value++;
			}}
		>{'increment'}</button>
		@try {
			<ReactiveDependencyResult {count} />
		} @pending {
			<p class="loading">{'loading...'}</p>
		}
	</>
}

export function AsyncWithReadOnlyDependency() @{
	const count = track(0);
	<>
		<button
			class="increment"
			onClick={() => {
				count.value++;
			}}
		>{'increment'}</button>
		@try {
			<ReactiveDependencyResult count={count.readOnly()} />
		} @pending {
			<p class="loading">{'loading...'}</p>
		}
	</>
}
