import { Context } from 'ripple';

/** @type {import('ripple').Context<import('@tanstack/router-core').AnyRouter | undefined>} */
export var routerContext = new Context();

/** @type {import('ripple').Context<{ routeId: string; match: import('ripple').Derived<import('@tanstack/router-core').AnyRouteMatch | undefined> } | undefined>} */
export var matchContext = new Context();
