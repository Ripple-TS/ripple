import { isTracked } from 'ripple';
import { render } from './harness.js';

export function renderHook(callback, { wrapper: Wrapper }) {
	let value;
	function Probe() {
		value = callback();
		return null;
	}
	const view = render(
		() => <Wrapper>
			<Probe />
		</Wrapper>,
	);
	return {
		...view,
		result: {
			get current() {
				return isTracked(value) ? value.value : value;
			},
		},
	};
}
