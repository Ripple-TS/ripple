import type { PressEvent } from 'react-aria-components';

export type ActionId = 'save' | 'delete';
export type ActionPointerType = PressEvent['pointerType'];

export interface ActionDetails {
	id: ActionId;
	label: string;
	description: string;
}

export interface ActionLogEntry {
	id: ActionId;
	label: string;
	pointerType: ActionPointerType;
}
