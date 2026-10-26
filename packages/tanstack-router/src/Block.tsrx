import { type Children } from 'ripple';
import { useBlocker } from './blocker.js';

export function Block(props: Parameters<typeof useBlocker>[0] & {
	children?: Children;
	render?: (state: any) => Children;
}) @{
	const resolver = useBlocker(props);
	const renderChild = props.render;
	<>
		{typeof renderChild === 'function' ? renderChild(resolver.value) : props.children}
	</>
}
