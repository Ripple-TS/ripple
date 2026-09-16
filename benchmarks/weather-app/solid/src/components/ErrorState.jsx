function ErrorState(props) {
	return (
		<div class="error" data-testid="error" hidden={!props.isVisible}>
			<h2 class="error__title">Unable to load weather data</h2>
			<p class="error__message">{props.message || 'Please check the city name and try again.'}</p>
		</div>
	);
}

export default ErrorState;
