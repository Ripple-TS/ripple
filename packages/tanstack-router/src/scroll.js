import { getElementScrollRestorationEntry, setupScrollRestoration } from '@tanstack/router-core';
import { useRouter } from './hooks.js';

/** @param {Parameters<typeof getElementScrollRestorationEntry>[1]} options */
export function useElementScrollRestoration(options) {
	var router = useRouter();
	setupScrollRestoration(router, true);
	return getElementScrollRestorationEntry(router, options);
}
