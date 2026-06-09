import { Dynamic, type Children } from 'ripple';

export function DocHeading({
	level,
	id,
	children,
}: {
	level: number;
	id: string;
	children: Children;
}) @{
	const tag = `h${level}`;
	const className = `doc-h${level}`;

	<Dynamic is={tag} {id} class={className}>
		{children}
		<a class="header-anchor" href={`#${id}`} aria-label={`Permalink`} />
	</Dynamic>
}
