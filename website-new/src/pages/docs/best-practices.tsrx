import { DocsLayout } from '../../components/docs-layout.tsrx';

module server {
	import { get_doc } from '../../lib/markdown.js';

	export function load_doc() {
		return get_doc('best-practices');
	}
}

import { load_doc } from server;

export component BestPracticesPage() {
	const doc = load_doc();

	<DocsLayout
		title={doc.title}
		editPath={doc.editPath}
		prevLink={doc.prev}
		nextLink={doc.next}
		toc={doc.toc}
		currentPath="/docs/best-practices"
	>
		<div class="doc-content">{html doc.html}</div>
	</DocsLayout>
}
