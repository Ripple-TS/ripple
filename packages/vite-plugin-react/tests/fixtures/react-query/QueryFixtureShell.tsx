import { useState } from 'react';
import {
	QueryClient,
	QueryClientProvider,
	useIsFetching,
	useQuery,
	type QueryClientConfig,
} from '@tanstack/react-query';
import type { ProjectFetcher, ProjectId, ProjectQueryStatus, ProjectSelector } from './types';
import { project_query_key } from './types';

export interface QueryFixtureShellProps {
	initialProjectId: ProjectId;
	alternateProjectId: ProjectId;
	fetchProject: ProjectFetcher;
	selectSummary: ProjectSelector;
}

const query_client_config: QueryClientConfig = {
	defaultOptions: {
		queries: {
			gcTime: Infinity,
			retry: false,
			staleTime: Infinity,
		},
	},
};

function ProjectPanel(props: {
	projectId: ProjectId;
	fetchProject: ProjectFetcher;
	selectSummary: ProjectSelector;
}) {
	const query = useQuery({
		queryKey: project_query_key(props.projectId),
		queryFn: () => props.fetchProject(props.projectId),
		select: props.selectSummary,
	});
	const status: ProjectQueryStatus = query.status;

	return (
		<section aria-label="Project query">
			<p className="query-status">{status}</p>
			<p className="query-project-id">{query.data?.id ?? 'none'}</p>
			<p className="query-name">{query.data?.name ?? 'Loading project'}</p>
			<p className="query-stars">{query.data?.stars ?? 0}</p>
			<p className="query-tag-count">{query.data?.tagCount ?? 0}</p>
			<button className="refetch-project" onClick={() => query.refetch()}>
				Refetch
			</button>
		</section>
	);
}

function CachedProjectMirror(props: { projectId: ProjectId; fetchProject: ProjectFetcher }) {
	const query = useQuery({
		queryKey: project_query_key(props.projectId),
		queryFn: () => props.fetchProject(props.projectId),
		select: (project) => project.name.toUpperCase(),
	});

	return <p className="query-mirror">{query.data ?? 'NO PROJECT'}</p>;
}

function QueryFixtureInner(props: QueryFixtureShellProps) {
	const [projectId, setProjectId] = useState<ProjectId>(props.initialProjectId);
	const fetchingCount = useIsFetching({ queryKey: ['project'] });

	return (
		<>
			<button className="show-initial" onClick={() => setProjectId(props.initialProjectId)}>
				Show initial
			</button>
			<button className="show-alternate" onClick={() => setProjectId(props.alternateProjectId)}>
				Show alternate
			</button>
			<p className="query-active-id">{projectId}</p>
			<p className="query-fetching-count">{fetchingCount}</p>
			<ProjectPanel
				projectId={projectId}
				fetchProject={props.fetchProject}
				selectSummary={props.selectSummary}
			/>
			<CachedProjectMirror projectId={projectId} fetchProject={props.fetchProject} />
		</>
	);
}

export function QueryFixtureShell(props: QueryFixtureShellProps) {
	const [queryClient] = useState(() => new QueryClient(query_client_config));

	return (
		<QueryClientProvider client={queryClient}>
			<QueryFixtureInner {...props} />
		</QueryClientProvider>
	);
}
