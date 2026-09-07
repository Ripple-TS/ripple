let setter = null;

export function bindSetter(nextSetter) {
	setter = nextSetter;
}

export function clearSetter() {
	setter = null;
}

export function commit(snapshot) {
	if (setter === null) throw new Error('UIbench fixture is not mounted');
	setter(snapshot);
}
