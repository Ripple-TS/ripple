import { Button, type ButtonProps } from 'react-aria-components';
import type { ActionDetails, ActionId, ActionPointerType } from './types';

export type AriaActionButtonProps = Pick<ButtonProps, 'aria-label' | 'isDisabled'> & {
	action: ActionDetails;
	onAction: (id: ActionId, pointerType: ActionPointerType) => void;
};

export function AriaActionButton(props: AriaActionButtonProps) {
	return (
		<Button
			aria-label={props['aria-label'] ?? props.action.label}
			data-action-id={props.action.id}
			isDisabled={props.isDisabled}
			onPress={(event) => props.onAction(props.action.id, event.pointerType)}
		>
			{({ isPressed }) => (
				<span data-pressed={isPressed ? 'yes' : 'no'}>
					{props.action.label}
					<span className="description">{props.action.description}</span>
				</span>
			)}
		</Button>
	);
}
