import { QueryClient } from '@tanstack/react-query';

const client = new QueryClient();

export function App() @{
	const label = `fetching: ${String(client.isFetching())}`;

	<div>{label}</div>
}
