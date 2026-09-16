import { type Derived } from 'ripple';

interface ErrorStateProps {
	isVisible: Derived<boolean>;
	message: Derived<string | null>;
}

export function ErrorState({ isVisible, message }: ErrorStateProps) @{
	<div class="error" data-testid="error" hidden={!isVisible.value}>
		<h2 class="error__title">Unable to load weather data</h2>
		<p class="error__message">{`${
			message.value || 'Please check the city name and try again.'
		}`}</p>
	</div>
}
