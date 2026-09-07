let waiters = [];

export function waitForPassiveEffects() {
	return new Promise((resolve) => {
		waiters.push(resolve);
	});
}

export function flushPassiveWaiters() {
	const pending = waiters;
	waiters = [];
	for (const resolve of pending) resolve();
}
