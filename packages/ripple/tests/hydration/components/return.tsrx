export function GuardReturnRenders() {
	const ready = true;
	if (!ready) {
		return null;
	}

	return <><div class="ready">{'ready'}</div></>;
}

export function GuardReturnNull() {
	const ready = false;
	if (!ready) {
		return null;
	}

	return <><div class="ready">{'ready'}</div></>;
}

export function StringReturn() {
	return 'hello';
}
