import { type Derived } from 'ripple';

interface LoadingStateProps {
	isVisible: Derived<boolean>;
}

export function LoadingState({ isVisible }: LoadingStateProps) @{
	<div class="loading" data-testid="loading" hidden={!isVisible.value}>
		<div class="loading__spinner"></div>
		<p>Loading weather data...</p>
	</div>
}
