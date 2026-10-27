import { render } from 'ripple/server';

export async function renderToString(component) {
	const result = await render(component);
	if (result.topLevelError) throw result.topLevelError;
	return result.head + result.body;
}
export const renderToStringAsync = renderToString;
