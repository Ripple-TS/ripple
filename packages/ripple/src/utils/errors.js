/** @returns {never} */
export function throw_tracked_index_value_error() {
	throw new Error(
		'Do not access tracked values with [0]. Use .value or &[] lazy destructuring instead. Numeric tracked access leads to degraded performance.',
	);
}

/** @returns {never} */
export function throw_tracked_index_reference_error() {
	throw new Error(
		'Do not access tracked values with [1]. Use the tracked value directly instead. Numeric tracked access leads to degraded performance.',
	);
}
