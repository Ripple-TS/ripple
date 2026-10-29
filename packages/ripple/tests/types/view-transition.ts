import {
	ViewTransition,
	createViewTransition,
	createRenderObserver,
	type Derived,
	type ViewTransitionClass,
	type ViewTransitionCallback,
} from 'ripple';

declare const liveName: Derived<string>;
declare const liveClass: Derived<ViewTransitionClass>;
ViewTransition({});
ViewTransition({ children: 'An element wrapper is needed to animate text.' });
const callback: ViewTransitionCallback = (instance, types) => {
	const animations = instance.new.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 100 });
	instance.group.getAnimations();
	instance.old.animate(null, 100);
	instance.imagePair.getAnimations();
	const name: string = instance.name;
	const names: readonly string[] = instance.names;
	const causes: readonly string[] = types;
	return () => animations.forEach((animation) => animation.cancel());
};
ViewTransition({
	name: liveName,
	enter: liveClass,
	exit: 'none',
	update: { default: 'auto', next: 'slide' },
	onEnter: callback,
	onExit: callback,
	onShare: callback,
	onUpdate: callback,
});
const transition = createViewTransition();
const handle = transition.run(async () => {}, { types: ['next'], timeout: 250 });
const rendered: Promise<boolean> = handle.rendered;
const ready: Promise<boolean> = handle.ready;
const finished: Promise<void> = handle.finished;
handle.skipTransition();
transition.dispose();
createRenderObserver().run(() => {}, { signal: new AbortController().signal });
// @ts-expect-error names are strings
ViewTransition({ name: 1 });
// @ts-expect-error class maps contain string values
ViewTransition({ enter: { next: false } });
// @ts-expect-error callbacks return a cleanup, not an animation
ViewTransition({ onUpdate: (instance) => instance.new.animate(null, 100) });
// @ts-expect-error transition types must be strings
transition.run(() => {}, { types: [1] });
