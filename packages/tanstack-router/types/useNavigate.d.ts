// Adapted from TanStack/solid-router at da2adec76dbe6c0da6d6a0d5640f7b9388217f45; see NOTICE.
import type { Derived } from 'ripple';
import type {
	AnyRouter,
	FromPathOption,
	NavigateOptions,
	RegisteredRouter,
	UseNavigateResult,
} from '@tanstack/router-core';
export function useNavigate<
	TRouter extends AnyRouter = RegisteredRouter,
	TDefaultFrom extends string = string,
>(_defaultOpts?: { from?: FromPathOption<TRouter, TDefaultFrom> }): UseNavigateResult<TDefaultFrom>;
