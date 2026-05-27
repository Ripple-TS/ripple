export function DocCallout({
	type = 'info',
	title = '',
	children,
}: {
	type?: 'info' | 'tip' | 'warning' | 'danger' | 'details';
	title?: string;
	children: any;
}) {
	return <>
		<div class={`${type} custom-block`}>
			if (title) {
				<p class="custom-block-title">{title}</p>
			}
			{children}
		</div>
	</>;
}
