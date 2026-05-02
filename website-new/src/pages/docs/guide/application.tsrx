import { DocsLayout } from '../../../components/docs-layout.tsrx';

module server {
	import { get_doc } from '../../../lib/markdown.js';

	export function load_doc() {
		return get_doc('guide/application');
	}
}

import { load_doc } from server;

export component ApplicationPage() {
	const doc = load_doc();

	<DocsLayout
		title={doc.title}
		editPath={doc.editPath}
		prevLink={doc.prev}
		nextLink={doc.next}
		toc={doc.toc}
		currentPath="/docs/guide/application"
	>
		<div class="doc-content">{html doc.html}</div>
	</DocsLayout>
}
