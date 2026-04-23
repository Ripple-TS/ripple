import { defineComponent, onErrorCaptured, shallowRef } from 'vue';

/**
 * A reusable Vue error boundary component.
 *
 * Used by the `@tsrx/vue` compiler to implement `try/catch` blocks.
 * The `fallback` prop receives the caught error and a `reset` function
 * that clears the error state to re-render the children.
 */
export const TsrxErrorBoundary = defineComponent({
	name: 'TsrxErrorBoundary',
	props: {
		fallback: {
			type: Function,
			required: true,
		},
	},
	setup(props, { slots }) {
		const error = shallowRef(/** @type {unknown} */ (null));

		const reset = () => {
			error.value = null;
		};

		onErrorCaptured((captured_error) => {
			error.value = captured_error;
			return false;
		});

		return () => {
			if (error.value !== null) {
				return props.fallback(error.value, reset);
			}

			return slots.default ? slots.default() : null;
		};
	},
});
