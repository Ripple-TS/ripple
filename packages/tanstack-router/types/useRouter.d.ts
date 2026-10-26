// Adapted from TanStack/solid-router at da2adec76dbe6c0da6d6a0d5640f7b9388217f45; see NOTICE.
import type { AnyRouter, RegisteredRouter } from '@tanstack/router-core';
export function useRouter<TRouter extends AnyRouter = RegisteredRouter>(): TRouter;
