import { useState, useMemo, useId, useRef, useEffect } from 'ripple-new';

// Dynamic object style + camelCase keys + a dynamic class.
export function Styled(props) @{
	<div class={props.klass} style={{ color: props.color, fontSize: '12px' }}>
		{props.label as string}
	</div>
}

// Boolean attribute, void element, static + dynamic attrs.
export function Field(props) @{
	<label>
		<input type="text" name="q" value={props.value} disabled={props.disabled} />
	</label>
}

// Spread attributes.
export function Spread(props) @{
	<div {...props.attrs} class="base">{'x'}</div>
}

// innerHTML (raw, unescaped).
export function Raw(props) @{
	<div innerHTML={props.html} />
}

// Hooks must render their initial value on the server (state initial, memo once,
// effects no-op). useId is deterministic.
export function HookView(props) @{
	const [n] = useState(props.start);
	const doubled = useMemo(() => n * 2, [n]);
	const id = useId();
	const ref = useRef(null);
	useEffect(() => {
		// must NOT run on the server
		props.onEffect();
	}, []);
	<section id={id}>
		<span class="n">
			{n as string}
		</span>
		<span class="d">
			{doubled as string}
		</span>
	</section>
}

// Nested component composition (no children).
function Badge(props) @{
	<em class="badge">
		{props.text as string}
	</em>
}

export function Card(props) @{
	<article class="card">
		<h2>
			{props.title as string}
		</h2>
		<Badge text={props.tag} />
	</article>
}

// Scoped <style> — CSS must be collected into RenderResult.css.
export function Scoped() @{
	<>
		<div class="box">{'scoped'}</div>
		<style>
			.box {
				color: red;
			}
		</style>
	</>
}
