import { ReactQueryFixture } from './App.tsrx';

function text(selector: string): string | null {
	return container.querySelector(selector)?.textContent ?? null;
}

async function wait_for(assertion: () => void) {
	let last_error: unknown;

	for (let i = 0; i < 50; i++) {
		try {
			assertion();
			return;
		} catch (error) {
			last_error = error;
		}

		await act(async () => {
			await new Promise((resolve) => setTimeout(resolve, 10));
		});
	}

	throw last_error;
}

describe('tsrx-react fixtures: react-query runtime', () => {
	it('loads TSRX-provided async data through TSX TanStack Query components', async () => {
		await render(ReactQueryFixture);

		expect(text('.query-status')).toBe('pending');
		expect(text('.query-name')).toBe('Loading project');

		await wait_for(() => {
			expect(text('.query-status')).toBe('success');
			expect(text('.query-project-id')).toBe('alpha');
			expect(text('.query-name')).toBe('Alpha Query');
			expect(text('.query-stars')).toBe('42');
			expect(text('.query-tag-count')).toBe('2');
			expect(text('.query-mirror')).toBe('ALPHA QUERY');
			expect(text('.query-fetch-count')).toBe('1');
			expect(text('.query-fetching-count')).toBe('0');
		});
	});

	it('shares one cached query result across multiple TSX consumers', async () => {
		await render(ReactQueryFixture);

		await wait_for(() => {
			expect(text('.query-name')).toBe('Alpha Query');
			expect(text('.query-mirror')).toBe('ALPHA QUERY');
			expect(text('.query-fetch-count')).toBe('1');
		});
	});

	it('switches query keys from TSRX props and reuses cached results', async () => {
		await render(ReactQueryFixture);

		await wait_for(() => {
			expect(text('.query-name')).toBe('Alpha Query');
			expect(text('.query-fetch-count')).toBe('1');
		});

		await act(async () => {
			(container.querySelector('.show-alternate') as HTMLButtonElement).click();
		});

		await wait_for(() => {
			expect(text('.query-active-id')).toBe('beta');
			expect(text('.query-name')).toBe('Beta Query');
			expect(text('.query-tag-count')).toBe('3');
			expect(text('.query-mirror')).toBe('BETA QUERY');
			expect(text('.query-fetch-count')).toBe('2');
		});

		await act(async () => {
			(container.querySelector('.show-initial') as HTMLButtonElement).click();
		});

		await wait_for(() => {
			expect(text('.query-active-id')).toBe('alpha');
			expect(text('.query-name')).toBe('Alpha Query');
			expect(text('.query-fetch-count')).toBe('2');
		});
	});

	it('refetches the active query through a TSX callback without losing selected data', async () => {
		await render(ReactQueryFixture);

		await wait_for(() => {
			expect(text('.query-name')).toBe('Alpha Query');
			expect(text('.query-fetch-count')).toBe('1');
		});

		await act(async () => {
			(container.querySelector('.refetch-project') as HTMLButtonElement).click();
		});

		await wait_for(() => {
			expect(text('.query-status')).toBe('success');
			expect(text('.query-name')).toBe('Alpha Query');
			expect(text('.query-fetch-count')).toBe('2');
			expect(text('.query-fetching-count')).toBe('0');
		});
	});
});
