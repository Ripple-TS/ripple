export default function LazyPage() {
	return <>
		<h1>Explicitly lazy page</h1>
		<p>This component is loaded from a separate production chunk.</p>
	</>;
}
