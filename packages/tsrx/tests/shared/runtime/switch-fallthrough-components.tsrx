// Shared runtime fixtures for the switch isolation test harness. Each
// platform's vite plugin transforms this file with its own compiler when
// the platform's `runtime.test.tsrx` imports the components.

export function AppSwitchIsolated({ status }: { status: string }) @{
	const obj = { idle: 'Online', active: 'Away', offline: 'Offline' } as const;

	@switch (status) {
		@case 'idle': {
			<span class="span-idle">{obj.idle}</span>
		}
		@case 'active': {
			<span class="span-active">{obj.active}</span>
		}
		@case 'offline': {
			<span class="span-offline">{obj.offline}</span>
		}
		@default: {
			<span class="span-default">{'Indeterminate'}</span>
		}
	}
}

export function AppSwitchEmptyCase({ status }: { status: string }) @{
	@switch (status) {
		@case 'idle': {
		}
		@case 'active': {
			<span class="span-active">{'Away'}</span>
		}
		@default: {
			<span class="span-default">{'Indeterminate'}</span>
		}
	}
}
