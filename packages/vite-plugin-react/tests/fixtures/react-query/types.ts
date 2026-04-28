import type { QueryKey, UseQueryResult } from '@tanstack/react-query';

export type ProjectId = 'alpha' | 'beta';

export interface Project {
	id: ProjectId;
	name: string;
	stars: number;
	tags: readonly string[];
}

export interface ProjectSummary {
	id: ProjectId;
	name: string;
	stars: number;
	tagCount: number;
}

export type ProjectQueryKey = readonly ['project', ProjectId];
export type ProjectFetcher = (id: ProjectId) => Promise<Project>;
export type ProjectSelector = (project: Project) => ProjectSummary;
export type ProjectQueryStatus = UseQueryResult<ProjectSummary, Error>['status'];

export function project_query_key(id: ProjectId): QueryKey {
	return ['project', id] satisfies ProjectQueryKey;
}
