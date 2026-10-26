import { bindInnerHTML, bindInnerText, bindTextContent, track, trackAsync } from 'ripple';

const bindings = {
	innerHTML: bindInnerHTML,
	innerText: bindInnerText,
	textContent: bindTextContent,
};

function Content({ kind, binding, seed, editable = true }) @{
	@switch (kind) {
		@case 'empty': {
			<div data-editor contenteditable="true" ref={binding} />
		}
		@case 'static': {
			<div data-editor contentEditable={true} ref={binding}>server &amp; text</div>
		}
		@case 'rich': {
			<div data-editor contentEditable={true} ref={binding}>
				<b>server</b>
				<i>text</i>
			</div>
		}
		@case 'html': {
			<div data-editor contentEditable={editable} innerHTML={seed} ref={binding} />
		}
		@case 'text': {
			<div data-editor contentEditable={editable} ref={binding}>{seed}</div>
		}
		@case 'nested': {
			<div data-editor contentEditable={true} ref={binding}>
				<b>{seed}</b>
				<i>tail</i>
			</div>
		}
		@case 'inherited': {
			<div contentEditable={true}>
				<Inherited binding={binding} seed={seed} />
			</div>
		}
		@case 'dynamic': {
			const tag = 'div';
			<{tag} data-editor contentEditable={true} ref={binding}>{seed}</{tag}>
		}
		@case 'spread': {
			<div data-editor {...{ contentEditable: editable, innerHTML: seed }} ref={binding} />
		}
	}
}

export function Editor({
	property = 'textContent',
	initial = '',
	next = 'updated',
	accessors = false,
	kind = 'empty',
	seed = '',
	editable = true,
	transform,
}) @{
	const value = track(initial);
	const bind = bindings[property];
	const binding =
		accessors
			? bind(() => value.value, (next) => (value.value = transform ? transform(next) : next))
			: bind(value);
	<section>
		<Content kind={kind} binding={binding} seed={seed} editable={editable} />
		<output>{JSON.stringify(value.value)}</output>
		<button onClick={() => (value.value = next)}>update</button>
	</section>
}

export function PlainSpread() {
	return <div data-editor {...{ id: 'plain' }}>unbound</div>;
}

export function ReactiveEditor({ property = 'innerHTML' }) @{
	const value = track('server');
	const binding = bindings[property](value);
	<section>
		@if (property === 'innerHTML') {
			<div data-editor contentEditable={true} innerHTML={value.value} ref={binding} />
		} @else {
			<div data-editor contentEditable={true} ref={binding}>{value.value}</div>
		}
		<output>{value.value}</output>
		<button onClick={() => (value.value = 'updated')}>update</button>
	</section>
}

function Inherited({ binding, seed }) {
	return <div data-editor ref={binding}>{seed}</div>;
}

export function AsyncEditor({ promise }) @{
	const seed = trackAsync(() => promise);
	const value = track('model');
	<section>
		<div data-editor contentEditable={true} ref={bindTextContent(value)}>{seed.value}</div>
		<output>{value.value}</output>
	</section>
}

function StreamContent({ promise }) @{
	const value = trackAsync(() => promise);
	<span>{value.value}</span>
}

export function NestedStreamEditor({ promise, property = 'textContent' }) @{
	const value = track('model');
	<section>
		<article contentEditable={true}>
			<strong data-outer>outer</strong>
			<div data-editor contentEditable={true} ref={bindings[property](value)}>
				<b>before</b>
				@try {
					<StreamContent promise={promise} />
				} @pending {
					<i>loading</i>
				}
			</div>
		</article>
		<output>{JSON.stringify(value.value)}</output>
	</section>
}
