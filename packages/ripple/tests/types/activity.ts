import { Activity, type ActivityProps, type Derived, type Tracked } from 'ripple';

declare const mode: Tracked<'visible' | 'hidden'>;
declare const derived: Derived<'visible' | 'hidden'>;
Activity({});
Activity({ mode: 'hidden' });
Activity({ mode });
Activity({ mode: derived });
const DynamicActivity: (props: ActivityProps) => void = Activity;
DynamicActivity({ mode });
// @ts-expect-error unsupported mode
Activity({ mode: 'inactive' });
