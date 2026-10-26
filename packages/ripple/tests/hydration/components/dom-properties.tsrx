import { track } from 'ripple';

export function Dialog({ managed = false }: { managed?: boolean }) @{
	const version = track(0);
	const open = track(false);
	<dialog {...{ class: 'v' + version.value }} open={managed ? open.value : undefined}>
		<button onClick={() => version.value++}>{'Update'}</button>
		<button onClick={() => (open.value = !open.value)}>{'Toggle'}</button>
	</dialog>
}

export function ManagedDialog() {
	return <Dialog managed={true} />;
}
