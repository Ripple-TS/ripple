import { track } from 'ripple';

export function Nested({ tag, ...attrs }) @{
	<section>
		<{tag} id="record" {...attrs} />
	</section>
}

export function Siblings() @{
	const tag = track('div');
	const count = track(0);
	const input = 'input';
	<section>
		<b>before</b>
		<{tag.value} id="record" data-count={count.value} innerHTML={`<em>${count.value}</em>`} />
		<{input} id="field" value={`value-${count.value}`} />
		<button onClick={() => count.value++}>update</button>
		<button onClick={() => (tag.value = 'article')}>replace</button>
		<p>after</p>
	</section>
}

function Child({ value }) @{
	<>
		<span>{value}</span>
		<strong>child</strong>
	</>
}

export function ComponentTarget() @{
	const tag = Child;
	<section>
		<{tag} value="component" />
		<p>after</p>
	</section>
}

export function Root() @{
	const tag = 'div';
	<>
		<{tag} id="record" innerHTML="root" />
		<p>after</p>
	</>
}

export function Svg() @{
	const tag = 'circle';
	<svg>
		<{tag} id="record" r="5" />
		<rect width="10" height="10" />
	</svg>
}
