import { DocsLayout } from '../../components/docs-layout.tsrx';

module server {
	import { get_doc } from '../../lib/markdown.js';

	export function load_doc() {
		return get_doc('troubleshooting');
	}
}

import { load_doc } from server;

export function TroubleshootingPage() {
	return <>
		const doc = load_doc();
		<DocsLayout
			title={doc.title}
			editPath={doc.editPath}
			prevLink={doc.prev}
			nextLink={doc.next}
			toc={doc.toc}
			currentPath="/docs/troubleshooting"
		>
			<div class="doc-content" innerHTML={doc.html} />
		</DocsLayout>
	</>;
}
