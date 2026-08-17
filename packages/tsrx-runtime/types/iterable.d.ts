// Helper type for item in an array or iterable
// example: IterationValue<typeof something>
export type IterationValue<T> = T extends readonly unknown[]
	? T[number]
	: T extends Iterable<infer U>
		? U
		: T extends Iterator<infer U>
			? U
			: never;

export function map_iterable<T, U>(
	value: Iterable<T> | Iterator<T>,
	fn: (item: T, index: number, is_last: boolean) => U,
	tail?: (() => U | U[]) | null,
	empty?: () => U | U[],
): U[];
