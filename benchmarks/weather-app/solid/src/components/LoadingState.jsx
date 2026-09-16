function LoadingState(props) {
	return (
		<div class="loading" data-testid="loading" hidden={!props.isVisible}>
			<div class="loading__spinner"></div>
			<p>Loading weather data...</p>
		</div>
	);
}

export default LoadingState;
