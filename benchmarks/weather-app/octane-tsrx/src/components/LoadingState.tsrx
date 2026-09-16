import { memo } from 'octane';

interface LoadingStateProps {
	isVisible: boolean;
}

function LoadingStateImpl({ isVisible }: LoadingStateProps) @{
	<div class="loading" data-testid="loading" hidden={!isVisible}>
		<div class="loading__spinner"></div>
		<p>Loading weather data...</p>
	</div>
}

export const LoadingState = memo(LoadingStateImpl);
