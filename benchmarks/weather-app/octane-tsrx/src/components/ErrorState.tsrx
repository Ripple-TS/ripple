import { memo } from 'octane';

interface ErrorStateProps {
	isVisible: boolean;
	message: string | null;
}

function ErrorStateImpl({ isVisible, message }: ErrorStateProps) @{
	<div class="error" data-testid="error" hidden={!isVisible}>
		<h2 class="error__title">Unable to load weather data</h2>
		<p class="error__message">{`${message || 'Please check the city name and try again.'}`}</p>
	</div>
}

export const ErrorState = memo(ErrorStateImpl);
