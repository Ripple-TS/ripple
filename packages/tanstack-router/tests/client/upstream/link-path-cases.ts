// Ported from TanStack/solid-router at da2adec76dbe6c0da6d6a0d5640f7b9388217f45; see NOTICE.
export const linkPathCases = [
	{ current: '/', to: '/', exact: true, active: true },
	{ current: '/posts', to: '/posts/', exact: true, active: true },
	{ current: '/posts/', to: '/posts', exact: true, active: true },
	{ current: '/posts/item', to: '/posts', exact: true, active: false },
	{ current: '/posts/item', to: '/posts', exact: false, active: true },
	{ current: '/posts/item', to: '/posts/', exact: false, active: true },
	{ current: '/posts-other', to: '/posts', exact: false, active: false },
];
