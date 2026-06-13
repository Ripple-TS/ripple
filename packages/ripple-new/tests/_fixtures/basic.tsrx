export function Hello() @{
	<div class="greet">{'Hello, world'}</div>
}

export function Counter(props) @{
	<span>
		{props.n as string}
	</span>
}

export function Greet(props) @{
	<p>
		{'Hello, '}
		{props.name}
		{' !'}
	</p>
}

export function Mixed() @{
	<div id="m">
		<span class="a">{'A'}</span>
		<span class="b">{'B'}</span>
	</div>
}

// SVG — namespace must be preserved on the root and on descendants. Static
// values are inlined into the template HTML so the HTML5 parser places them
// in the SVG namespace via foreign-content rules.
export function SvgStatic() @{
	<svg id="chart" viewBox="0 0 100 100" class="chart">
		<circle cx="50" cy="50" r="40" fill="red" />
		<g class="labels">
			<text x="50" y="55">{'hi'}</text>
		</g>
	</svg>
}

// SVG with dynamic attribute + dynamic class — exercises the runtime paths
// (setAttribute / setClassName), which must NOT use the .className property
// on SVG (read-only SVGAnimatedString).
export function SvgDynamic(props) @{
	<svg id="dyn" viewBox="0 0 100 100" class={props.klass}>
		<rect x="0" y="0" width={props.w} height="20" fill={props.fill} />
	</svg>
}

// MathML — same parser story: HTML5 foreign content handles <math>.
export function MathStatic() @{
	<math id="eq" display="block">
		<mrow>
			<mi>{'a'}</mi>
			<mo>{'+'}</mo>
			<mi>{'b'}</mi>
		</mrow>
	</math>
}

export function MathDynamic(props) @{
	<math id="dyneq" display={props.display}>
		<mn class={props.klass}>
			{props.value as string}
		</mn>
	</math>
}
