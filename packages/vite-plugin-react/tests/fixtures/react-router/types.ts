import type { Location, To } from 'react-router';

export type ProjectId = 'alpha' | 'beta';

export interface ProjectRoute {
	id: ProjectId;
	name: string;
	to: To;
	searchLabel: (location: Pick<Location, 'search'>) => string;
}
