// Runtime-inserted foreignObject + refs on foreign elements.
//
// The static template-clone path for foreignObject (svg-foreign-object) and
// refs on SVG/MathML (svg-refs-events) is already covered. What was NOT
// exercised is the createElementNS COMMIT path: an SVG subtree born from an
// `@if` branch must push/pop the namespace stack (SVG → XHTML inside
// <foreignObject> → back to SVG for the following sibling) at runtime, and a
// ref on a dynamically inserted SVG element must attach/detach correctly.

// foreignObject namespace switching driven through @if (runtime insertion).
export function ForeignObjectInIf(props) @{
	<>
		@if (props.show) {
			<svg id="fo-svg" viewBox="0 0 100 100">
				<foreignObject id="fo" x="0" y="0" width="100" height="100">
					<div id="fo-html" class="html-inside">
						<span id="fo-span">
							{props.label as string}
						</span>
					</div>
				</foreignObject>
				<rect id="fo-rect" class="svg-after" x="0" y="0" width="10" height="10" />
			</svg>
		} @else {
			<span class="fallback">{'hidden'}</span>
		}
	</>
}

// Callback ref on an SVG <circle> that only exists while the @if branch is
// mounted — exercises ref attach (with an SVGElement) and detach (null) across
// the runtime insertion path.
export function SvgCallbackRefInIf(props) @{
	<>
		@if (props.show) {
			<svg id="ref-svg">
				<circle id="ref-circle" class="target" ref={(el) => props.observe(el)} />
			</svg>
		} @else {
			<span class="fallback">{'hidden'}</span>
		}
	</>
}
