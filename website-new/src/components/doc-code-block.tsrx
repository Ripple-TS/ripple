import { Fragment } from 'ripple';

import { highlight } from '../lib/markdown.js';

export function DocCodeBlock({ code, lang = 'text' }: { code: string; lang?: string }) @{
	const highlighted = highlight(code, lang);

	<div class={`language-${lang}`}>
		<button title="Copy Code" class="copy" />
		<span class="lang">{lang}</span>
		<Fragment innerHTML={highlighted} />
	</div>
}

export function DocCodeGroup({ code, lang = 'tsrx' }: { code: string; lang?: string }) @{
	const highlighted = highlight(code, lang);

	<div class="doc-code-group">
		<div class="tabs">
			<button class="tab active">Code</button>
			<button class="tab">Playground</button>
		</div>
		<div class="blocks">
			<div class={`language-${lang}`}>
				<button title="Copy Code" class="copy" />
				<span class="lang">{lang}</span>
				<Fragment innerHTML={highlighted} />
			</div>
		</div>
	</div>
}
