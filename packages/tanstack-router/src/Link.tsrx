import { track, type Children, type Component, type Derived } from 'ripple';
import { useLinkProps } from './link.js';
import { useRouter } from './hooks.js';

export function Link(props: Record<string, any>) @{
	const linkProps = useLinkProps(props);
	const renderChild = props.render;
	<a {...linkProps.value}>
		<LinkContent {linkProps} {renderChild} children={props.children} />
	</a>
}

// Custom anchors receive one live props object to spread, preserving Ripple's
// explicit reactivity and ref ownership without remounting the component.
export function createLink(Component: Component<{
	linkProps: Derived<Record<string, any>>;
	children?: Children;
}>) {
	return function CustomLink(props: Record<string, any>) @{
		const linkProps = useLinkProps(props);
		<Component {...props} {linkProps}>
			<LinkContent {linkProps} renderChild={props.render} children={props.children} />
		</Component>
	};
}

export function createRouteLink(getFrom: () => string) {
	return function RouteLink(props: Record<string, any>) {
		return <Link from={getFrom()} {...props} />;
	};
}

export function createRouteIdLink(id: string) {
	return createRouteLink(() => useRouter().routesById[id].fullPath);
}

function LinkContent({
	linkProps,
	renderChild,
	children,
}: {
	linkProps: Derived<Record<string, any>>;
	renderChild?: (state: { readonly isActive: boolean }) => Children;
	children?: Children;
}) @{
	const active = track(() => linkProps.value['data-status'] === 'active');
	<>
		{renderChild
			? renderChild({
					get isActive() {
						return active.value;
					},
				})
			: children}
	</>
}
