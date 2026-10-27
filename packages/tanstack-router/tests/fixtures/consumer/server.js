import { render } from 'ripple/server';
import { Probe } from '@ripple-ts/router-source-fixture';
export { Probe };

export function renderProbe() {
	return render(Probe);
}

export { makeSsrRouter } from './router.tsrx';
export {
	createRequestHandler,
	renderRouterToString,
	renderRouterToStream,
} from '@ripple-ts/tanstack-router/ssr/server';
