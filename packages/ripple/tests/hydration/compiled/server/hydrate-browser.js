// @ts-nocheck
import * as _$_ from 'ripple/internal/server';

import { Hydrate, Activity, track, effect, bindChecked, bindValue } from 'ripple/server';
import { idle, visible, interaction, media, condition, never, load } from 'ripple/hydration';

function record(kind, name) {
	if (typeof window !== 'undefined') window.hydrateTrace.push({ kind, name, time: performance.now() });
}

function Widget({ name }) {
	return _$_.tsrx_element(() => {
		record('init', name);

		_$_.effect(() => {
			record('effect', name);
		});

		_$_.regular_block(() => {
			let __out = '';

			__out += '<p' + _$_.attr('data-widget', name, false) + '>' + _$_.escape(name) + '</p>';
			_$_.output_push(__out);
		});
	});
}

function Actions() {
	return _$_.tsrx_element(() => {
		record('init', 'actions');

		const checked = _$_.track(false, '1y0nxn7');
		const value = _$_.track('server', 'ckuxtp');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div><input id="checkbox" type="checkbox" /><output id="checked">' + _$_.escape(String(checked.value)) + '</output><input id="draft" /><output id="draft-value">';

			{
				_$_.output_push(__out);
				__out = '';
				_$_.render_expression(value.value);
			}

			__out += '</output><button id="button">button</button><button id="stop">stop</button><a id="link" href="#destination">navigate</a><a id="cancel-link" href="#cancelled">cancel</a><form><button id="submit">submit</button></form></div>';
			_$_.output_push(__out);
		});
	});
}

function Key() {
	return _$_.tsrx_element(() => {
		record('init', 'key');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<input id="key" />';
			_$_.output_push(__out);
		});
	});
}

function Focus() {
	return _$_.tsrx_element(() => {
		record('init', 'focus');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<input id="focus" />';
			_$_.output_push(__out);
		});
	});
}

function Enter() {
	return _$_.tsrx_element(() => {
		record('init', 'enter');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<button id="enter">hover</button>';
			_$_.output_push(__out);
		});
	});
}

function Static() {
	return _$_.tsrx_element(() => {
		_$_.output_register_css('tsrx-e90d79db');
		record('init', 'never');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<p id="static" class="tsrx-e90d79db">styled before hydration</p>';
			_$_.output_push(__out);
		});
	});
}

function Row({ index }) {
	return _$_.tsrx_element(() => {
		record('row', String(index));

		_$_.regular_block(() => {
			let __out = '';

			__out += '<li>' + _$_.escape(String(index)) + '</li>';
			_$_.output_push(__out);
		});
	});
}

function Composed({ name }) {
	return _$_.tsrx_element(() => {
		record('init', name);

		_$_.regular_block(() => {
			let __out = '';

			__out += '<button' + _$_.attr('id', name, false) + '>' + _$_.escape(name) + '</button>';
			_$_.output_push(__out);
		});
	});
}

export function App() {
	return _$_.tsrx_element(() => {
		const enabled = _$_.track(false, 'h2n1qn');

		if (typeof window !== 'undefined') window.openLarge = () => enabled.value = true;

		_$_.regular_block(() => {
			let __out = '';

			__out += '<main>';

			{
				const comp = Hydrate;

				_$_.output_push(__out);
				__out = '';

				const args = [
					{
						when: idle({ timeout: 30 }),
						children: _$_.tsrx_element(() => {
							return _$_.tsrx_element(() => {
								{
									const comp = Widget;
									const args = [{ name: "idle" }];

									_$_.render_component(comp, ...args);
								}
							});
						})
					}
				];

				_$_.output_push(__out);
				__out = '';
				_$_.render_component(comp, ...args);
			}

			{
				const comp = Hydrate;

				_$_.output_push(__out);
				__out = '';

				const args = [
					{
						when: media('(min-width: 1200px)'),
						children: _$_.tsrx_element(() => {
							return _$_.tsrx_element(() => {
								{
									const comp = Widget;
									const args = [{ name: "media" }];

									_$_.render_component(comp, ...args);
								}
							});
						})
					}
				];

				_$_.output_push(__out);
				__out = '';
				_$_.render_component(comp, ...args);
			}

			{
				const comp = Hydrate;

				_$_.output_push(__out);
				__out = '';

				const args = [
					{
						when: interaction({ events: 'click' }),
						children: _$_.tsrx_element(() => {
							return _$_.tsrx_element(() => {
								{
									const comp = Actions;
									const args = [{}];

									_$_.render_component(comp, ...args);
								}
							});
						})
					}
				];

				_$_.output_push(__out);
				__out = '';
				_$_.render_component(comp, ...args);
			}

			{
				const comp = Hydrate;

				_$_.output_push(__out);
				__out = '';

				const args = [
					{
						when: condition(false),
						onHydrated: () => record('hydrated', 'key-parent'),
						children: _$_.tsrx_element(() => {
							return _$_.tsrx_element(() => {
								{
									const comp = Hydrate;

									const args = [
										{
											when: interaction({ events: 'keydown' }),
											children: _$_.tsrx_element(() => {
												return _$_.tsrx_element(() => {
													{
														const comp = Key;
														const args = [{}];

														_$_.render_component(comp, ...args);
													}
												});
											})
										}
									];

									_$_.render_component(comp, ...args);
								}
							});
						})
					}
				];

				_$_.output_push(__out);
				__out = '';
				_$_.render_component(comp, ...args);
			}

			{
				const comp = Hydrate;

				_$_.output_push(__out);
				__out = '';

				const args = [
					{
						when: interaction({ events: 'focusin' }),
						children: _$_.tsrx_element(() => {
							return _$_.tsrx_element(() => {
								{
									const comp = Focus;
									const args = [{}];

									_$_.render_component(comp, ...args);
								}
							});
						})
					}
				];

				_$_.output_push(__out);
				__out = '';
				_$_.render_component(comp, ...args);
			}

			{
				const comp = Hydrate;

				_$_.output_push(__out);
				__out = '';

				const args = [
					{
						when: interaction({ events: 'pointerenter' }),
						children: _$_.tsrx_element(() => {
							return _$_.tsrx_element(() => {
								{
									const comp = Enter;
									const args = [{}];

									_$_.render_component(comp, ...args);
								}
							});
						})
					}
				];

				_$_.output_push(__out);
				__out = '';
				_$_.render_component(comp, ...args);
			}

			{
				const comp = Hydrate;

				_$_.output_push(__out);
				__out = '';

				const args = [
					{
						when: never(),
						children: _$_.tsrx_element(() => {
							return _$_.tsrx_element(() => {
								{
									const comp = Static;
									const args = [{}];

									_$_.render_component(comp, ...args);
								}
							});
						})
					}
				];

				_$_.output_push(__out);
				__out = '';
				_$_.render_component(comp, ...args);
			}

			{
				const comp = Activity;

				_$_.output_push(__out);
				__out = '';

				const args = [
					{
						children: _$_.tsrx_element(() => {
							return _$_.tsrx_element(() => {
								{
									const comp = Hydrate;

									const args = [
										{
											when: interaction({ events: 'click' }),
											children: _$_.tsrx_element(() => {
												return _$_.tsrx_element(() => {
													{
														const comp = Composed;
														const args = [{ name: "activity-hydrate" }];

														_$_.render_component(comp, ...args);
													}
												});
											})
										}
									];

									_$_.render_component(comp, ...args);
								}
							});
						})
					}
				];

				_$_.output_push(__out);
				__out = '';
				_$_.render_component(comp, ...args);
			}

			{
				const comp = Hydrate;

				_$_.output_push(__out);
				__out = '';

				const args = [
					{
						when: interaction({ events: 'click' }),
						children: _$_.tsrx_element(() => {
							return _$_.tsrx_element(() => {
								{
									const comp = Activity;

									const args = [
										{
											children: _$_.tsrx_element(() => {
												return _$_.tsrx_element(() => {
													{
														const comp = Composed;
														const args = [{ name: "hydrate-activity" }];

														_$_.render_component(comp, ...args);
													}
												});
											})
										}
									];

									_$_.render_component(comp, ...args);
								}
							});
						})
					}
				];

				_$_.output_push(__out);
				__out = '';
				_$_.render_component(comp, ...args);
			}

			{
				const comp = Hydrate;

				_$_.output_push(__out);
				__out = '';

				const args = [
					{
						when: interaction({ events: 'click' }),
						children: _$_.tsrx_element(() => {
							return _$_.tsrx_element(() => {
								{
									const comp = Activity;

									const args = [
										{
											children: _$_.tsrx_element(() => {
												return _$_.tsrx_element(() => {
													{
														const comp = Hydrate;

														const args = [
															{
																when: load(),
																children: _$_.tsrx_element(() => {
																	return _$_.tsrx_element(() => {
																		{
																			const comp = Composed;
																			const args = [{ name: "hydrate-activity-load" }];

																			_$_.render_component(comp, ...args);
																		}
																	});
																})
															}
														];

														_$_.render_component(comp, ...args);
													}
												});
											})
										}
									];

									_$_.render_component(comp, ...args);
								}
							});
						})
					}
				];

				_$_.output_push(__out);
				__out = '';
				_$_.render_component(comp, ...args);
			}

			__out += '<div style="height:3000px"></div>';

			{
				const comp = Hydrate;

				_$_.output_push(__out);
				__out = '';

				const args = [
					{
						when: visible({ rootMargin: '0px', threshold: [0, 0.5] }),
						children: _$_.tsrx_element(() => {
							return _$_.tsrx_element(() => {
								let __out = '';

								{
									const comp = Widget;
									const args = [{ name: "visible" }];

									_$_.output_push(__out);
									__out = '';
									_$_.render_component(comp, ...args);
								}

								__out += '<span id="visible-tail">tail</span>';
								_$_.output_push(__out);
							});
						})
					}
				];

				_$_.output_push(__out);
				__out = '';
				_$_.render_component(comp, ...args);
			}

			{
				const comp = Hydrate;

				_$_.output_push(__out);
				__out = '';

				const args = [
					{
						when: () => location.search.includes('eager') ? load() : condition(() => enabled.value),
						children: _$_.tsrx_element(() => {
							return _$_.tsrx_element(() => {
								let __out = '';

								__out += '<ul id="large"><!--[-->';

								for (const index of Array.from({ length: 2500 }, (_, index) => index)) {
									{
										const comp = Row;
										const args = [{ index }];

										_$_.output_push(__out);
										__out = '';
										_$_.render_component(comp, ...args);
									}
								}

								__out += '<!--]--></ul>';
								_$_.output_push(__out);
							});
						})
					}
				];

				_$_.output_push(__out);
				__out = '';
				_$_.render_component(comp, ...args);
			}

			__out += '<div id="destination">destination</div></main>';
			_$_.output_push(__out);
		});
	});
}

_$_.register_css('tsrx-e90d79db', '\n			p.tsrx-e90d79db {\n				color: rgb(17, 34, 51);\n			}\n		');