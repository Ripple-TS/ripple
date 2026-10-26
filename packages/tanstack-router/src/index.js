// Framework-neutral entry points. Ripple routing components arrive in milestone 2.
export {
	createControlledPromise,
	defaultParseSearch,
	defaultStringifySearch,
	isNotFound,
	isRedirect,
	notFound,
	redirect,
} from '@tanstack/router-core';

export { createBrowserHistory, createHashHistory, createMemoryHistory } from '@tanstack/history';
