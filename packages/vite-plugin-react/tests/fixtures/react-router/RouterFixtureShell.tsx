import {
	Link,
	MemoryRouter,
	Route,
	Routes,
	useLocation,
	useParams,
	useSearchParams,
} from 'react-router';
import type { ProjectId, ProjectRoute } from './types';

export interface RouterFixtureShellProps {
	routes: readonly ProjectRoute[];
	initialEntry: string;
	fallbackLabel: string;
}

function ProjectLink(props: { route: ProjectRoute }) {
	return (
		<Link data-route-id={props.route.id} to={props.route.to}>
			{props.route.name}
		</Link>
	);
}

function ProjectDetails(props: { routes: readonly ProjectRoute[] }) {
	const params = useParams<{ projectId: ProjectId }>();
	const [searchParams] = useSearchParams();
	const location = useLocation();
	const route = props.routes.find((candidate) => candidate.id === params.projectId);

	if (!route) {
		return <p className="route-missing">Missing project</p>;
	}

	return (
		<section aria-label="Project route">
			<h2 className="route-title">{route.name}</h2>
			<p className="route-id">{route.id}</p>
			<p className="route-tab">{searchParams.get('tab') ?? 'overview'}</p>
			<p className="route-search-label">{route.searchLabel(location)}</p>
		</section>
	);
}

export function RouterFixtureShell(props: RouterFixtureShellProps) {
	return (
		<MemoryRouter initialEntries={[props.initialEntry]}>
			<nav aria-label="Projects">
				{props.routes.map((route) => (
					<ProjectLink key={route.id} route={route} />
				))}
			</nav>
			<Routes>
				<Route path="/projects/:projectId" element={<ProjectDetails routes={props.routes} />} />
				<Route path="*" element={<p className="route-fallback">{props.fallbackLabel}</p>} />
			</Routes>
		</MemoryRouter>
	);
}
