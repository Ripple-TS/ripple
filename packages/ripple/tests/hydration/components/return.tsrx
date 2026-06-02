export function GuardReturnRenders() {
	return <>
		const ready = true;
		if (!ready) {
			return null;
		}
		<div class="ready">{'ready'}</div>
	</>;
}

export function GuardReturnNull() {
	return <>
		const ready = false;
		if (!ready) {
			return null;
		}
		<div class="ready">{'ready'}</div>
	</>;
}

export function StringReturn() {
	return 'hello';
}
