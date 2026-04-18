describe('generic patterns', () => {
	it('tests simple generic function', () => {
		component App() {
			const e = new Map<string, Promise<number>>();
			const a = new Array<number>();

			const b = new Array<string>();

			<div class="still-works">
				<span>{'Test'}</span>
			</div>

			const someSource = new Array<number>(1, 2, 3);
			const d = someSource.map<number>((x) => x * 2).filter<number>((x) => !!x);
		}

		render(App);
	});

	it('tests member expression)', () => {
		component App() {
			class List<T> {
				items: T[];
				constructor() {
					this.items = [];
				}
			}

			<div class="still-works">
				<span>{'Test'}</span>
			</div>

			class Containers {
				static List<T>() {
					return new List<T>();
				}
			}

			const c = Containers.List<string>();
		}

		render(App);
	});

	it('tests simple generic function with return type', () => {
		component App() {
			function getBuilder() {
				return {
					build: function <T>() {
						return 'test';
					},
				};
			}
		}

		render(App);
	});

	it('tests simple generic function with return type and no arrow function', () => {
		component App() {
			function getBuilder() {
				return {
					build<T>(): T {
						return 'test' as unknown as T;
					},
				};
			}

			<div class="still-works">
				<span>{'Test'}</span>
			</div>

			const f = getBuilder().build<string>();
		}

		render(App);
	});

	it('tests simple generic arrow function with return type', () => {
		component App() {
			function getBuilder() {
				return <T,>() => ({
					build<T>(): T {
						return 'test' as unknown as T;
					},
				});
			}

			type ResultType = string;

			const f = getBuilder()<ResultType>().build<string>();
		}

		render(App);
	});

	it('tests simple generic arrow function with explicit return type', () => {
		component App() {
			function getBuilder() {
				return <T,>() => ({
					build<U>(): U {
						return 'test' as U;
					},
				});
			}

			<div class="still-works">
				<span>{'Test'}</span>
			</div>

			type ResultType = string;
			const f = getBuilder()<ResultType>().build<string>();
			<div>{f}</div>
		}

		render(App);
	});

	it('tests complex generic arrow function with return type', () => {
		component App() {
			function getBuilder() {
				return <T,>() => ({
					build<V, T, U>(): { build: () => V; data: T; key: U } {
						return {
							build(): V {
								return 'test' as V;
							},
							data: undefined as T,
							key: undefined as U,
						};
					},
				});
			}

			<div class="still-works">
				<span>{'Test'}</span>
			</div>

			type ResultType = string;
			const f = getBuilder()<ResultType>().build<string, object, string>();
			<div>{f}</div>
		}

		render(App);
	});

	it('tests more complex generic arrow function with return type', () => {
		component App() {
			function getBuilder() {
				return <T,>() => ({
					build<V, T, U>(): { build: () => V; data: T; key: U } {
						return {
							build(): V {
								return 'test' as V;
							},
							data: undefined as T,
							key: undefined as U,
						};
					},
				});
			}

			<div class="still-works">
				<span>{'Test'}</span>
			</div>

			type ResultType = string;
			const f = getBuilder()<ResultType>().build<string, object, string>();
			<div>{f}</div>
		}

		render(App);
	});

	it('tests most complex generic arrow function with return type', () => {
		component App() {
			function getBuilder() {
				return <T,>() => ({
					build<V, T, U>(): { build: () => V; data: T; key: U } {
						return {
							build(): V {
								return 42 as V;
							},
							data: undefined as T,
							key: undefined as U,
						};
					},
				});
			}

			<div class="still-works">
				<span>{'Test'}</span>
			</div>

			type ResultType = string;
			const f = getBuilder()<ResultType>().build<number, object, string>();
			<div>{f}</div>
		}

		render(App);
	});
});
