import type { JSXElementConstructor, act as reactAct } from 'react';

declare global {
	var IS_REACT_ACT_ENVIRONMENT: boolean;

	var render: <Props extends object>(
		component: JSXElementConstructor<{}>,
		props?: Props,
	) => Promise<void>;

	var act: typeof reactAct;
	var container: HTMLDivElement;
}
