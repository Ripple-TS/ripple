// Ported from TanStack/react-router at da2adec76dbe6c0da6d6a0d5640f7b9388217f45; see NOTICE.
import { createLazyRoute } from '@ripple-ts/tanstack-router';

export function Route(id: string) {
	return createLazyRoute(id)({
		component: () => <div>About route content</div>,
		errorComponent: ({ error }) => <div>
			Lazy Error:{' '}
			{error instanceof Error ? error.message : String(error)}
		</div>,
	});
}
