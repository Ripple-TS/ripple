// Shared runtime fixtures for the switch fall-through test harness. Each
// platform's vite plugin transforms this file with its own compiler when
// the platform's `runtime.test.tsrx` imports the components — see
// `runSwitchFallthroughRuntimeTests` in
// `@tsrx/core/test-harness/runtime/switch-fallthrough`. The source is
// identical across targets; the mounted DOM should be identical because
// fall-through is defined by JavaScript `switch` semantics.

export function AppFallthroughAll({ status }: { status: string }) {
	return <>
		const obj = { idle: 'Online', active: 'Away', offline: 'Offline' } as const;
		switch (status) {
			case 'idle':
				<span class="span-idle">{obj.idle}</span>
			case 'active':
				<span class="span-active">{obj.active}</span>
			case 'offline':
				<span class="span-offline">{obj.offline}</span>
			default:
				<span class="span-default">{'Indeterminate'}</span>
		}
	</>;
}

export function AppBreakAfterActive({ status }: { status: string }) {
	return <>
		const obj = { idle: 'Online', active: 'Away', offline: 'Offline' } as const;
		switch (status) {
			case 'idle':
				<span class="span-idle">{obj.idle}</span>
			case 'active':
				<span class="span-active">{obj.active}</span>
				break;
			case 'offline':
				<span class="span-offline">{obj.offline}</span>
			default:
				<span class="span-default">{'Indeterminate'}</span>
		}
	</>;
}

export function AppBreakAfterOffline({ status }: { status: string }) {
	return <>
		const obj = { idle: 'Online', active: 'Away', offline: 'Offline' } as const;
		switch (status) {
			case 'idle':
				<span class="span-idle">{obj.idle}</span>
			case 'active':
				<span class="span-active">{obj.active}</span>
			case 'offline':
				<span class="span-offline">{obj.offline}</span>
				break;
			default:
				<span class="span-default">{'Indeterminate'}</span>
		}
	</>;
}
