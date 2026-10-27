// Adapted from TanStack/solid-router tests/server/lazyRouteComponent.test.tsx and
// component-preload-retry.test.tsx at da2adec76dbe6c0da6d6a0d5640f7b9388217f45; see NOTICE.
import { afterEach, expect, it, vi } from 'vitest';
import { Context, type Children } from 'ripple';
import { render } from 'ripple/server';
import { lazyRouteComponent } from '@ripple-ts/tanstack-router';

afterEach(() => vi.restoreAllMocks());
it('a successful server component download is reused', async () => {
	const importer = vi.fn().mockResolvedValue({ default: () => <p>Page</p> });
	const Page = lazyRouteComponent(importer);
	const preload = Page.preload!();
	await preload;
	expect(Page.preload!()).toBe(preload);
	expect((await render(Page)).body).toContain('Page');
	expect((await render(Page)).body).toContain('Page');
	expect(importer).toHaveBeenCalledOnce();
});
it('renders a preloaded component without pending output and reuses its import', async () => {
	const importer = vi.fn(
		async () => ({ default: ({ label }: { label: string }) => <span>{label}</span> }),
	);
	const Page = lazyRouteComponent(importer);
	const preload = Page.preload!();
	await preload;
	function App() @{
		@try {
			<Page label="Preloaded page" />
		} @pending {
			<span>Pending</span>
		}
	}
	const records: string[] = [];
	await render(App, {
		stream: {
			push: (chunk) => records.push(chunk),
			close() {},
			error(error) {
				throw error;
			},
		},
	});
	expect(records[0]).toContain('Preloaded page');
	expect(records.join('')).not.toContain('Pending');
	expect(Page.preload!()).toBe(preload);
	expect(importer).toHaveBeenCalledOnce();
});
it('renders after an awaited retry of a failed import', async () => {
	const failure = new Error('component download failed');
	const importer = vi.fn().mockRejectedValueOnce(failure).mockResolvedValue({
		default: ({ label }: any) => <span>{label}</span>,
	});
	const Page = lazyRouteComponent(importer);
	await Page.preload!();
	vi.spyOn(console, 'error').mockImplementation(() => {});
	expect((await render(() => <Page label="First attempt" />)).topLevelError).toBe(failure);
	const retry = Page.preload!();
	await retry;
	expect((await render(() => <Page label="Recovered page" />)).body).toContain('Recovered page');
	expect(Page.preload!()).toBe(retry);
	expect(importer).toHaveBeenCalledTimes(2);
});
it.each([false, true])('preserves provider context and component props (preload: %s)', async (
	preload,
) => {
	const context = new Context('missing context');
	const importer = vi.fn(
		async () => ({
			Page: ({ label, children }: { label: string; children: Children }) =>
				<span>{context.get()}:{label}:{children}</span>,
		}),
	);
	const Page = lazyRouteComponent(importer, 'Page');
	if (preload) await Page.preload!();
	function App() @{
		context.set('provided context');
		@try {
			<Page label="page prop">child prop</Page>
		} @pending {
			<span>Pending</span>
		}
	}
	const { body } = await render(App);
	for (const expected of ['provided context', 'page prop', 'child prop']) expect(body).toContain(
		expected,
	);
	expect(body).not.toContain('missing context');
	expect(body).not.toContain('Pending');
	expect(importer).toHaveBeenCalledOnce();
});
