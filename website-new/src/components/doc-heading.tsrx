import type { Children } from 'ripple';

export function DocHeading({
	level,
	id,
	children,
}: {
	level: number;
	id: string;
	children: Children;
}) {
	return <>
		@if (level === 1) {
			<h1 {id} class="doc-h1">
				{children}
				<a class="header-anchor" href={`#${id}`} aria-label={`Permalink`} />
			</h1>
		} else if (level === 2) {
			<h2 {id} class="doc-h2">
				{children}
				<a class="header-anchor" href={`#${id}`} aria-label={`Permalink`} />
			</h2>
		} else if (level === 3) {
			<h3 {id} class="doc-h3">
				{children}
				<a class="header-anchor" href={`#${id}`} aria-label={`Permalink`} />
			</h3>
		} else if (level === 4) {
			<h4 {id} class="doc-h4">
				{children}
				<a class="header-anchor" href={`#${id}`} aria-label={`Permalink`} />
			</h4>
		}
	</>;
}
