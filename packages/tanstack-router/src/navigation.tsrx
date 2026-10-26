import { effect, untrack, trackAsync, type Children, type Derived } from 'ripple';
import { useRouter, useMatchRoute } from './hooks.js';
import { resolveInput, resolveInputs } from './inputs.js';

export function Navigate(props: Record<string, any>) @{
	const router = useRouter();
	effect(() => {
		const options = resolveInputs(props);
		untrack(() => {
			void router.navigate(options).catch(console.error);
		});
	});
	<></>
}

export function MatchRoute(props: Record<string, any>) @{
	const params = useMatchRoute()(props);
	const renderChild = props.render;
	const children = props.children;
	<>
		{renderChild
			? renderChild(params.value)
			: params.value
				? children
				: null}
	</>
}

export function useAwaited<T>({ promise }: { promise: Promise<T> | Derived<Promise<T>> }) {
	return trackAsync(() => resolveInput(promise));
}

function AwaitInner(props: {
	promise: Promise<any> | Derived<Promise<any>>;
	render: (value: any) => Children;
}) @{
	const data = useAwaited(props);
	const renderChild = props.render;
	<>
		{renderChild(data.value)}
	</>
}

export function Await(props: {
	promise: Promise<any> | Derived<Promise<any>>;
	render: (value: any) => Children;
	fallback?: Children;
}) @{
	@if ('fallback' in props) {
		@try {
			<AwaitInner {...props} />
		} @pending {
			<>
				{props.fallback}
			</>
		}
	} @else {
		<AwaitInner {...props} />
	}
}
