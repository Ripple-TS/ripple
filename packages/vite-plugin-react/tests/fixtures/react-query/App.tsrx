import { useState } from 'react';
import { QueryFixtureShell } from './QueryFixtureShell.tsx';
import type { Project, ProjectId, ProjectSummary } from './types';

const projects: Record<ProjectId, Project> = {
	alpha: {
		id: 'alpha',
		name: 'Alpha Query',
		stars: 42,
		tags: ['cache', 'client'],
	},
	beta: {
		id: 'beta',
		name: 'Beta Query',
		stars: 7,
		tags: ['router', 'forms', 'async'],
	},
};

function delay() {
	return new Promise<void>((resolve) => {
		setTimeout(resolve, 5);
	});
}

export component ReactQueryFixture() {
	const [fetchCount, setFetchCount] = useState(0);

	async function fetchProject(id: ProjectId): Promise<Project> {
		setFetchCount((count) => count + 1);
		await delay();
		return projects[id];
	}

	function selectSummary(project: Project): ProjectSummary {
		return {
			id: project.id,
			name: project.name,
			stars: project.stars,
			tagCount: project.tags.length,
		};
	}

	<QueryFixtureShell
		initialProjectId="alpha"
		alternateProjectId="beta"
		{fetchProject}
		{selectSummary}
	/>
	<output class="query-fetch-count">{fetchCount}</output>
}
