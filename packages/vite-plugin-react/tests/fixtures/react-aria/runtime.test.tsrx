import { ReactAriaFixture } from './App.tsrx';

function text(selector: string): string | null {
	return container.querySelector(selector)?.textContent ?? null;
}

describe('tsrx-react fixtures: react-aria runtime', () => {
	it('renders and updates a TSRX component through TSX React Aria modules', async () => {
		await render(ReactAriaFixture);

		const saveButton = container.querySelector(
			'[data-action-id="save"]',
		) as HTMLButtonElement | null;
		const deleteButton = container.querySelector(
			'[data-action-id="delete"]',
		) as HTMLButtonElement | null;

		expect(saveButton).not.toBeNull();
		expect(deleteButton).not.toBeNull();
		expect(saveButton?.tagName).toBe('BUTTON');
		expect(saveButton?.getAttribute('aria-label')).toBe('Save draft with React Aria');
		expect(deleteButton?.disabled).toBe(true);
		expect(text('.last-action')).toBe('none');
		expect(text('.action-count')).toBe('0');

		await act(async () => {
			saveButton?.click();
		});

		expect(text('.last-action')).toBe('save');
		expect(text('.last-pointer')).not.toBe('none');
		expect(text('.action-count')).toBe('1');
	});
});
