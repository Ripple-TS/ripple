// @ts-nocheck
import * as _$_ from 'ripple/internal/server';

import {
	ViewTransition,
	Activity,
	createViewTransition,
	track,
	trackAsync
} from 'ripple/server';

let transition;
let count;
let detail;
let shown;
let rows;

export let last;
export const events = [];
export const cleanups = [];

const record = (kind) => (instance, types) => {
	events.push({
		kind,
		name: instance.name,
		names: instance.names,
		types,
		duration: getComputedStyle(document.documentElement, `::view-transition-${kind === 'exit' ? 'old' : 'new'}(${instance.name})`).animationDuration
	});

	if (kind === 'update') {
		const animations = instance.new.animate([{ opacity: 0.5 }, { opacity: 1 }], { duration: 80 });

		return () => {
			cleanups.push(kind);
			animations.forEach((animation) => animation.cancel());
		};
	}

	return () => {
		cleanups.push(kind);
	};
};

export function run(action, skip = false) {
	last = transition.run(
		() => {
			if (action === 'share') detail.value = !detail.value; else if (action === 'exit') shown.value = false; else if (action === 'enter') shown.value = true; else if (action === 'reorder') rows.value = [...rows.value].reverse(); else count.value++;
		},
		{ types: ['forward'] }
	);

	if (skip) last.skipTransition();

	return last;
}

export function App() {
	return _$_.tsrx_element(() => {
		_$_.output_register_css('tsrx-430cbf0c');
		transition = createViewTransition();
		count = _$_.track(0, '19w3y5g');
		detail = _$_.track(false, '1lbcaqw');
		shown = _$_.track(true, 'v5prji');
		rows = _$_.track([1, 2, 3], '1droy1q');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<main class="tsrx-430cbf0c"><button id="increment" class="tsrx-430cbf0c">increment</button>';

			{
				const comp = ViewTransition;

				_$_.output_push(__out);
				__out = '';

				const args = [
					{
						name: "counter",
						update: "change",
						onUpdate: record('update'),
						children: _$_.tsrx_element(() => {
							return _$_.tsrx_element(() => {
								let __out = '';

								__out += '<section class="tsrx-430cbf0c"><input id="focus" value="editable" class="tsrx-430cbf0c" /><output class="tsrx-430cbf0c">' + _$_.escape(count.value) + '</output></section>';
								_$_.output_push(__out);
							});
						})
					}
				];

				_$_.output_push(__out);
				__out = '';
				_$_.render_component(comp, ...args);
			}

			if (shown.value) {
				_$_.output_push(__out);
				__out = '';
				_$_.branch_marker(0);

				{
					const comp = ViewTransition;

					_$_.output_push(__out);
					__out = '';

					const args = [
						{
							name: "notice",
							enter: "notice-in",
							exit: "notice-out",
							onEnter: record('enter'),
							onExit: record('exit'),
							children: _$_.tsrx_element(() => {
								return _$_.tsrx_element(() => {
									let __out = '';

									__out += '<p id="notice" class="tsrx-430cbf0c">Saved</p>';
									_$_.output_push(__out);
								});
							})
						}
					];

					_$_.output_push(__out);
					__out = '';
					_$_.render_component(comp, ...args);
				}
			} else {
				_$_.output_push(__out);
				__out = '';
				_$_.branch_marker(-1);
			}

			__out += '<!--]-->';

			if (detail.value) {
				_$_.output_push(__out);
				__out = '';
				_$_.branch_marker(0);
				__out += '<article class="tsrx-430cbf0c">';

				{
					{
						const comp = ViewTransition;

						_$_.output_push(__out);
						__out = '';

						const args = [
							{
								name: "photo",
								share: "share",
								onShare: record('share'),
								children: _$_.tsrx_element(() => {
									return _$_.tsrx_element(() => {
										let __out = '';

										__out += '<h2 id="photo" class="tsrx-430cbf0c">detail</h2>';
										_$_.output_push(__out);
									});
								})
							}
						];

						_$_.output_push(__out);
						__out = '';
						_$_.render_component(comp, ...args);
					}
				}

				__out += '</article>';
			} else {
				_$_.output_push(__out);
				__out = '';
				_$_.branch_marker(1);
				__out += '<aside class="tsrx-430cbf0c">';

				{
					{
						const comp = ViewTransition;

						_$_.output_push(__out);
						__out = '';

						const args = [
							{
								name: "photo",
								share: "share",
								onShare: record('share'),
								children: _$_.tsrx_element(() => {
									return _$_.tsrx_element(() => {
										let __out = '';

										__out += '<h3 id="photo" class="tsrx-430cbf0c">thumbnail</h3>';
										_$_.output_push(__out);
									});
								})
							}
						];

						_$_.output_push(__out);
						__out = '';
						_$_.render_component(comp, ...args);
					}
				}

				__out += '</aside>';
			}

			__out += '<!--]--><!--[-->';

			for (const row of rows.value) {
				{
					const comp = ViewTransition;

					_$_.output_push(__out);
					__out = '';

					const args = [
						{
							name: 'row-' + row,
							onUpdate: record('reorder'),
							children: _$_.tsrx_element(() => {
								return _$_.tsrx_element(() => {
									let __out = '';

									__out += '<p class="row tsrx-430cbf0c">' + _$_.escape(row) + '</p>';
									_$_.output_push(__out);
								});
							})
						}
					];

					_$_.output_push(__out);
					__out = '';
					_$_.render_component(comp, ...args);
				}
			}

			__out += '<!--]--></main>';
			_$_.output_push(__out);
		});
	});
}

const samples = Array.from({ length: 500 }, (_, index) => index);

export function ManyPlain() {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			let __out = '';

			__out += '<!--[-->';

			for (const row of samples) {
				__out += '<p>';

				{
					_$_.output_push(__out);
					__out = '';
					_$_.render_expression(row);
				}

				__out += '</p>';
			}

			__out += '<!--]-->';
			_$_.output_push(__out);
		});
	});
}

export function ManyWrapped() {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			let __out = '';

			__out += '<!--[-->';

			for (const row of samples) {
				{
					const comp = ViewTransition;

					_$_.output_push(__out);
					__out = '';

					const args = [
						{
							children: _$_.tsrx_element(() => {
								return _$_.tsrx_element(() => {
									let __out = '';

									__out += '<p>';

									{
										_$_.output_push(__out);
										__out = '';
										_$_.render_expression(row);
									}

									__out += '</p>';
									_$_.output_push(__out);
								});
							})
						}
					];

					_$_.output_push(__out);
					__out = '';
					_$_.render_component(comp, ...args);
				}
			}

			__out += '<!--]-->';
			_$_.output_push(__out);
		});
	});
}

const pending = Promise.withResolvers();

export function resolveAsync() {
	pending.resolve('loaded content');
}

function AsyncContent() {
	return _$_.tsrx_element(() => {
		const data = _$_.track_async(() => pending.promise, '1v5cfcv');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<p id="async-result">';

			{
				_$_.output_push(__out);
				__out = '';
				_$_.render_expression(data.value);
			}

			__out += '</p>';
			_$_.output_push(__out);
		});
	});
}

export function AsyncApp() {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			{
				const comp = ViewTransition;

				const args = [
					{
						name: "async-content",
						update: "change",
						onUpdate: record('reveal'),
						children: _$_.tsrx_element(() => {
							return _$_.tsrx_element(() => {
								_$_.try_block(
									() => {
										let __out = '';

										__out += '<!--[-->';

										{
											const comp = AsyncContent;
											const args = [{}];

											_$_.output_push(__out);
											__out = '';
											_$_.render_component(comp, ...args);
										}

										__out += '<!--]-->';
										_$_.output_push(__out);
									},
									null,
									() => {
										let __out = '';

										__out += '<!--[--><p id="skeleton">loading</p><!--]-->';
										_$_.output_push(__out);
									}
								);
							});
						})
					}
				];

				_$_.render_component(comp, ...args);
			}
		});
	});
}

export function Gallery() {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			let __out = '';

			{
				const comp = ViewTransition;

				_$_.output_push(__out);
				__out = '';

				const args = [
					{
						name: "photo",
						share: "share",
						children: _$_.tsrx_element(() => {
							return _$_.tsrx_element(() => {
								let __out = '';

								__out += '<div id="photo">thumbnail</div>';
								_$_.output_push(__out);
							});
						})
					}
				];

				_$_.output_push(__out);
				__out = '';
				_$_.render_component(comp, ...args);
			}

			__out += '<a id="next" href="/document-b">Open photo</a>';
			_$_.output_push(__out);
		});
	});
}

export function Detail() {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			let __out = '';

			{
				const comp = ViewTransition;

				_$_.output_push(__out);
				__out = '';

				const args = [
					{
						name: "photo",
						share: "share",
						children: _$_.tsrx_element(() => {
							return _$_.tsrx_element(() => {
								let __out = '';

								__out += '<div id="photo">large photo</div>';
								_$_.output_push(__out);
							});
						})
					}
				];

				_$_.output_push(__out);
				__out = '';
				_$_.render_component(comp, ...args);
			}

			__out += '<a id="next" href="/document-a">Back to gallery</a>';
			_$_.output_push(__out);
		});
	});
}

let activityMode;

export function runActivity(mode) {
	return transition.run(() => {
		activityMode.value = mode;
	});
}

function ActivityPanel() {
	return _$_.tsrx_element(() => {
		const value = _$_.track(0, '1v0qx1h');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<section><input id="activity-input" value="draft" /><button id="activity-count">' + _$_.escape(value.value) + '</button></section>';
			_$_.output_push(__out);
		});
	});
}

export function ActivityApp() {
	return _$_.tsrx_element(() => {
		transition = createViewTransition();
		activityMode = _$_.track('visible', 'lmdfag');

		_$_.regular_block(() => {
			{
				const comp = ViewTransition;

				const args = [
					{
						name: "activity",
						enter: "notice-in",
						exit: "notice-out",
						onEnter: record('enter'),
						onExit: record('exit'),
						children: _$_.tsrx_element(() => {
							return _$_.tsrx_element(() => {
								{
									const comp = Activity;

									const args = [
										{
											mode: activityMode,
											children: _$_.tsrx_element(() => {
												return _$_.tsrx_element(() => {
													{
														const comp = ActivityPanel;
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

				_$_.render_component(comp, ...args);
			}
		});
	});
}

export function InnerActivityApp() {
	return _$_.tsrx_element(() => {
		transition = createViewTransition();
		activityMode = _$_.track('visible', '1fmrgqv');

		_$_.regular_block(() => {
			{
				const comp = Activity;

				const args = [
					{
						mode: activityMode,
						children: _$_.tsrx_element(() => {
							return _$_.tsrx_element(() => {
								{
									const comp = ViewTransition;

									const args = [
										{
											name: "activity",
											enter: "notice-in",
											exit: "notice-out",
											onEnter: record('enter'),
											onExit: record('exit'),
											children: _$_.tsrx_element(() => {
												return _$_.tsrx_element(() => {
													{
														const comp = ActivityPanel;
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

				_$_.render_component(comp, ...args);
			}
		});
	});
}

_$_.register_css('tsrx-430cbf0c', '\n			::view-transition-new(.notice-in) {\n				animation: tsrx-430cbf0c-appear 120ms linear;\n			}\n			::view-transition-old(.notice-out) {\n				animation: tsrx-430cbf0c-appear 120ms linear reverse;\n			}\n			::view-transition-new(.change) {\n				animation: tsrx-430cbf0c-appear 100ms linear;\n			}\n			::view-transition-new(.share) {\n				animation: tsrx-430cbf0c-appear 140ms linear;\n			}\n			::view-transition-image-pair(.share) {\n				isolation: isolate;\n			}\n			::view-transition-group(.share) {\n				animation-duration: 140ms;\n			}\n			@keyframes tsrx-430cbf0c-appear {\n				from {\n					opacity: 0;\n				}\n				to {\n					opacity: 1;\n				}\n			}\n			@media (prefers-reduced-motion: reduce) {\n				::view-transition-group(*) {\n					animation-duration: 0s;\n				}\n			}\n		');