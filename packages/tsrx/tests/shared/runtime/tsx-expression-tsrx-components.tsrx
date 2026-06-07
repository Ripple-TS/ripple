function PlainTextPlugin(props: { contentEditable: any; placeholder: any }) @{
	<section class="tsrx-expression-prop-root">
		<div class="tsrx-expression-content">{props.contentEditable}</div>
		<div class="tsrx-expression-plugin-placeholder">{props.placeholder}</div>
	</section>
}

function ContentEditable(props: {
	'aria-placeholder'?: string;
	class?: string;
	className?: string;
	placeholder: any;
}) @{
	const className = props.className ?? props.class ?? '';

	<article class="tsrx-expression-editable">
		<span class="tsrx-expression-editable-class">{className}</span>
		<div class="tsrx-expression-inner-placeholder">{props.placeholder}</div>
	</article>
}

export function TsrxInTsxExpressionApp() @{
	const placeholder = 'shared placeholder';
	const classes = {
		contentEditable: 'editable-class',
		placeholder: 'placeholder-class',
	};
	function renderPlugin() {
		return <>
			<PlainTextPlugin
				contentEditable={<>
					<ContentEditable
						aria-placeholder={placeholder}
						class={classes.contentEditable}
						placeholder={<><div class={classes.placeholder}>{placeholder}</div></>}
					/>
				</>}
				placeholder={<><div class={classes.placeholder}>{placeholder}</div></>}
			/>
		</>;
	}

	<>
		{renderPlugin()}
	</>
}
