export function DocBadge({
	type = 'info',
	text: label,
}: {
	type?: 'info' | 'warning' | 'danger';
	text: string;
}) {
	return <><span class={`badge ${type}`}>{label}</span></>;
}
