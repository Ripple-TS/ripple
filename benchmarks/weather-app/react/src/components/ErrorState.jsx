import React from 'react';

const ErrorState = ({ isVisible, message }) => {
	return (
		<div className="error" data-testid="error" hidden={!isVisible}>
			<h2 className="error__title">Unable to load weather data</h2>
			<p className="error__message">{message || 'Please check the city name and try again.'}</p>
		</div>
	);
};

export default React.memo(ErrorState);
