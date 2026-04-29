import { ReactRouterFixture } from './App.tsrx';

function text(selector: string): string | null {
	return container.querySelector(selector)?.textContent ?? null;
}

describe('tsrx-react fixtures: react-router runtime', () => {
	it('renders and navigates through TSRX data passed into TSX React Router modules', async () => {
		await render(ReactRouterFixture);

		const alphaLink = container.querySelector(
			'[data-route-id="alpha"]',
		) as HTMLAnchorElement | null;
		const betaLink = container.querySelector('[data-route-id="beta"]') as HTMLAnchorElement | null;

		expect(alphaLink?.getAttribute('href')).toBe('/projects/alpha?tab=activity');
		expect(betaLink?.getAttribute('href')).toBe('/projects/beta?tab=settings');
		expect(text('.route-title')).toBe('Alpha project');
		expect(text('.route-id')).toBe('alpha');
		expect(text('.route-tab')).toBe('activity');
		expect(text('.route-search-label')).toBe('?tab=activity');

		await act(async () => {
			betaLink?.click();
		});

		expect(text('.route-title')).toBe('Beta project');
		expect(text('.route-id')).toBe('beta');
		expect(text('.route-tab')).toBe('settings');
		expect(text('.route-search-label')).toBe('query:tab=settings');
	});
});
