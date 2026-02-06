export type RequireAllOrNone<T, K extends keyof T> =
	| (T & Required<Pick<T, K>>)
	| (T & { [P in K]?: never });

export type RequiredPresent<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;
