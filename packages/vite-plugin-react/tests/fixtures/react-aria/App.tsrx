import { useState } from 'react';
import { AriaActionButton } from './AriaActionButton.tsx';
import type { ActionDetails, ActionId, ActionLogEntry, ActionPointerType } from './types';

const saveAction: ActionDetails = {
	id: 'save',
	label: 'Save draft',
	description: 'Stores changes through a React Aria button',
};

const deleteAction: ActionDetails = {
	id: 'delete',
	label: 'Delete draft',
	description: 'Disabled destructive action',
};

export component ReactAriaFixture() {
	const [entries, setEntries] = useState<ActionLogEntry[]>([]);
	const lastEntry = entries.at(-1);

	function recordAction(id: ActionId, pointerType: ActionPointerType) {
		const action =
			id === saveAction.id ? saveAction : deleteAction;
		setEntries((prev) => [...prev, { id, label: action.label, pointerType }]);
	}

	<section aria-label="React Aria TSRX fixture">
		<AriaActionButton
			action={saveAction}
			aria-label="Save draft with React Aria"
			onAction={recordAction}
		/>
		<AriaActionButton action={deleteAction} isDisabled={true} onAction={recordAction} />
		<output class="last-action">{lastEntry ? lastEntry.id : 'none'}</output>
		<output class="last-pointer">{lastEntry ? lastEntry.pointerType : 'none'}</output>
		<output class="action-count">{entries.length}</output>
	</section>
}
