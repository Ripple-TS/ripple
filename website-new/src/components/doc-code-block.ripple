import { highlight } from '../lib/markdown.js';

export component DocCodeBlock({ code, lang = 'text' }: { code: string; lang?: string }) {
	const highlighted = highlight(code, lang);

	<div class={`language-${lang}`}>
		<button title="Copy Code" class="copy" />
		<span class="lang">{lang}</span>
		{html highlighted}
	</div>
}

export component DocCodeGroup({ code, lang = 'ripple' }: { code: string; lang?: string }) {
	const highlighted = highlight(code, lang);

	<div class="doc-code-group">
		<div class="tabs">
			<button class="tab active">{'Code'}</button>
			<button class="tab">{'Playground'}</button>
		</div>
		<div class="blocks">
			<div class={`language-${lang}`}>
				<button title="Copy Code" class="copy" />
				<span class="lang">{lang}</span>
				{html highlighted}
			</div>
		</div>
	</div>
}
