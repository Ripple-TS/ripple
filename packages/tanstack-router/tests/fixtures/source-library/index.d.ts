import type { Component } from 'ripple';

export interface ProbeProps {
	onMount?: () => void;
	onDispose?: () => void;
}

export const Probe: Component<ProbeProps>;
