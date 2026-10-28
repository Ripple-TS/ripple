import { Hydrate, track, type HydrateOptions, type HydrationStrategy, type Derived } from 'ripple';
import {
	condition,
	idle,
	interaction,
	load,
	media,
	never,
	visible,
	type HydrationInteractionEvent,
} from 'ripple/hydration';

const options: HydrateOptions = {
	when: () => visible({ threshold: [0, 0.5, 1] }),
	onHydrated() {},
};
Hydrate(options);
Hydrate({ when: condition(() => true) });
Hydrate({ when: track(() => idle({ timeout: 123 })) });
Hydrate({ when: interaction({ events: ['click', 'focusin'] as const }) });
Hydrate({ when: interaction({ events: 'keydown' }) });
Hydrate({ when: media('(min-width: 100px)') });
Hydrate({ when: load() });
Hydrate({ when: never(), children: track('text') });
declare const strategy: Derived<HydrationStrategy>;
Hydrate({ when: strategy });
const event: HydrationInteractionEvent = 'pointerenter';
interaction({ events: event });
// @ts-expect-error when is mandatory
Hydrate({});
// @ts-expect-error factories are synchronous
Hydrate({ when: async () => load() });
// @ts-expect-error use a strategy, not a boolean
Hydrate({ when: true });
// @ts-expect-error supported intent vocabulary only
interaction({ events: 'input' });
// @ts-expect-error unsupported chunk-splitting extension
Hydrate({ when: load(), split: true });
// @ts-expect-error unsupported prefetch extension
Hydrate({ when: load(), prefetch: idle() });
