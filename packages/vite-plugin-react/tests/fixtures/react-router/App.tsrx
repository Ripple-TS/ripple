import { RouterFixtureShell } from './RouterFixtureShell.tsx';
import type { ProjectRoute } from './types';

const projectRoutes: readonly ProjectRoute[] = [
	{
		id: 'alpha',
		name: 'Alpha project',
		to: '/projects/alpha?tab=activity',
		searchLabel(location) {
			return location.search || 'no search';
		},
	},
	{
		id: 'beta',
		name: 'Beta project',
		to: { pathname: '/projects/beta', search: '?tab=settings' },
		searchLabel(location) {
			return location.search.replace('?', 'query:');
		},
	},
];

export component ReactRouterFixture() {
	<RouterFixtureShell
		routes={projectRoutes}
		initialEntry="/projects/alpha?tab=activity"
		fallbackLabel="No matching route"
	/>
}
