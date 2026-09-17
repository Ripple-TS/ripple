import { track, flushSync } from 'ripple';
import type { Component, PropsWithChildren, PropsWithExtras } from 'ripple';

const SVG_NS = 'http://www.w3.org/2000/svg';
const HTML_NS = 'http://www.w3.org/1999/xhtml';

// The namespace is only known at runtime here: the component's children are
// compiled without it and rendered into an `<svg>` the component owns, so
// every block must keep the namespace it was created in when it reruns.
describe('SVG namespace in runtime-only contexts', () => {
	function SVG({ children }: PropsWithChildren<{}>) @{
		<svg>{children}</svg>
	}

	it('parses a nested template in the SVG namespace', () => {
		function App() @{
			<SVG>
				<g class="group">
					<circle r="1" />
				</g>
			</SVG>
		}

		render(App);
		expect(container.querySelector('.group').namespaceURI).toBe(SVG_NS);
		expect(container.querySelector('circle').namespaceURI).toBe(SVG_NS);
	});

	it('keeps the namespace when an @if in component children toggles', () => {
		let setFlag: ((value: boolean) => void) | undefined;

		function App() @{
			const flag = track(true);
			setFlag = (value) => {
				flag.value = value;
			};
			<SVG>
				@if (flag.value) {
					<polygon class="a" points="0,0 1,1" />
				} @else {
					<g class="b">
						<rect width="1" height="1" />
					</g>
				}
			</SVG>
		}

		render(App);
		expect(container.querySelector('.a').namespaceURI).toBe(SVG_NS);
		flushSync(() => setFlag?.(false));
		expect(container.querySelector('.b').namespaceURI).toBe(SVG_NS);
		expect(container.querySelector('rect').namespaceURI).toBe(SVG_NS);
		flushSync(() => setFlag?.(true));
		expect(container.querySelector('.a').namespaceURI).toBe(SVG_NS);
	});

	it('keeps the namespace when an @if in a leaf component toggles', () => {
		let setFlag: ((value: boolean) => void) | undefined;

		function Shape() @{
			const flag = track(true);
			setFlag = (value) => {
				flag.value = value;
			};
			@if (flag.value) {
				<polygon class="a" points="0,0 1,1" />
			} @else {
				<rect class="b" width="1" height="1" />
			}
		}

		function App() @{
			<svg>
				<Shape />
			</svg>
		}

		render(App);
		expect(container.querySelector('.a').namespaceURI).toBe(SVG_NS);
		flushSync(() => setFlag?.(false));
		expect(container.querySelector('.b').namespaceURI).toBe(SVG_NS);
	});

	it('keeps the namespace when a dynamic tag in component children changes', () => {
		let setTag: ((value: string) => void) | undefined;

		function App() @{
			const tag = track('polygon');
			setTag = (value) => {
				tag.value = value;
			};
			<SVG>
				<{tag.value} class="shape" />
			</SVG>
		}

		render(App);
		expect(container.querySelector('.shape').namespaceURI).toBe(SVG_NS);
		flushSync(() => setTag?.('rect'));
		const shape = container.querySelector('.shape');
		expect(shape.localName).toBe('rect');
		expect(shape.namespaceURI).toBe(SVG_NS);
	});

	it('keeps the namespace for items added to an @for in component children', () => {
		let setItems: ((value: string[]) => void) | undefined;

		function App() @{
			const items = track(['a']);
			setItems = (value) => {
				items.value = value;
			};
			<SVG>
				@for (const id of items.value) {
					<circle data-id={id} r="1" />
				}
			</SVG>
		}

		render(App);
		expect(container.querySelector('[data-id=a]').namespaceURI).toBe(SVG_NS);
		flushSync(() => setItems?.(['a', 'b']));
		expect(container.querySelector('[data-id=b]').namespaceURI).toBe(SVG_NS);
	});

	it('renders HTML inside a foreignObject in component children', () => {
		let setTag: ((value: string) => void) | undefined;

		function App() @{
			const tag = track('div');
			setTag = (value) => {
				tag.value = value;
			};
			<SVG>
				<foreignObject>
					@if (tag.value !== 'none') {
						<div class="static-label">
							<span>hi</span>
						</div>
					}
					<{tag.value} class="html-label">Label</{tag.value}>
				</foreignObject>
				<circle class="after" r="1" />
			</SVG>
		}

		render(App);
		expect(container.querySelector('.static-label').namespaceURI).toBe(HTML_NS);
		expect(container.querySelector('span').namespaceURI).toBe(HTML_NS);
		expect(container.querySelector('.html-label').namespaceURI).toBe(HTML_NS);
		expect(container.querySelector('.after').namespaceURI).toBe(SVG_NS);
		flushSync(() => setTag?.('span'));
		const label = container.querySelector('.html-label');
		expect(label.localName).toBe('span');
		expect(label.namespaceURI).toBe(HTML_NS);
	});

	it('sets a dynamic class on SVG elements in component children', () => {
		let setName: ((value: string) => void) | undefined;

		function App() @{
			const name = track('one');
			setName = (value) => {
				name.value = value;
			};
			<SVG>
				<circle class={name.value} r="1" />
				<a class={name.value} href="#link">
					<text>link</text>
				</a>
			</SVG>
		}

		render(App);
		expect(container.querySelector('circle').getAttribute('class')).toBe('one');
		expect(container.querySelector('a').getAttribute('class')).toBe('one');
		flushSync(() => setName?.('two'));
		expect(container.querySelector('circle').getAttribute('class')).toBe('two');
		expect(container.querySelector('a').getAttribute('class')).toBe('two');
	});
});

describe('dynamic element namespace changes', () => {
	it('switches a root between HTML and SVG with its children', () => {
		let setTag: ((value: string) => void) | undefined;

		function App() @{
			const tag = track('div');
			setTag = (value) => {
				tag.value = value;
			};
			<{tag.value} class="root">
				<g class="inner">
					<title>t</title>
				</g>
			</{tag.value}>
		}

		render(App);
		expect(container.querySelector('.root').namespaceURI).toBe(HTML_NS);
		expect(container.querySelector('.inner').namespaceURI).toBe(HTML_NS);
		flushSync(() => setTag?.('svg'));
		expect(container.querySelector('.root').namespaceURI).toBe(SVG_NS);
		expect(container.querySelector('.inner').namespaceURI).toBe(SVG_NS);
		expect(container.querySelector('title').namespaceURI).toBe(SVG_NS);
		flushSync(() => setTag?.('div'));
		expect(container.querySelector('.root').namespaceURI).toBe(HTML_NS);
		expect(container.querySelector('.inner').namespaceURI).toBe(HTML_NS);
	});

	it('renders HTML children once the tag becomes foreignObject', () => {
		let setTag: ((value: string) => void) | undefined;

		function App() @{
			const tag = track('g');
			setTag = (value) => {
				tag.value = value;
			};
			<svg>
				<{tag.value} class="host">
					<a class="content">hi</a>
				</{tag.value}>
			</svg>
		}

		render(App);
		expect(container.querySelector('.host').namespaceURI).toBe(SVG_NS);
		expect(container.querySelector('.content').namespaceURI).toBe(SVG_NS);
		flushSync(() => setTag?.('foreignObject'));
		const host = container.querySelector('.host');
		expect(host.localName).toBe('foreignObject');
		expect(host.namespaceURI).toBe(SVG_NS);
		expect(container.querySelector('.content').namespaceURI).toBe(HTML_NS);
		flushSync(() => setTag?.('g'));
		expect(container.querySelector('.content').namespaceURI).toBe(SVG_NS);
	});
});

describe('SVG namespace handling', () => {
	it('preserves SVG and foreignObject namespaces when dynamic tags change', () => {
		let setTags: ((svgTag: string, htmlTag: string) => void) | undefined;

		function App() @{
			const shape = track('circle');
			const html = track('div');
			setTags = (svgTag, htmlTag) => {
				shape.value = svgTag;
				html.value = htmlTag;
			};
			<svg>
				<{shape.value} class="shape">
					<title>Dynamic shape</title>
				</{shape.value}>
				<foreignObject>
					<{html.value} class="html-label">Label</{html.value}>
				</foreignObject>
			</svg>
		}

		render(App);
		for (const [svgTag, htmlTag] of [['circle', 'div'], ['path', 'span'], ['line', 'div']]) {
			flushSync(() => {
				setTags?.(svgTag, htmlTag);
			});
			const element = container.querySelector('.shape');
			expect(element.localName).toBe(svgTag);
			expect(element.namespaceURI).toBe('http://www.w3.org/2000/svg');
			expect(element.querySelector('title').namespaceURI).toBe('http://www.w3.org/2000/svg');
			expect(element.textContent).toBe('Dynamic shape');
			const label = container.querySelector('.html-label');
			expect(label.localName).toBe(htmlTag);
			expect(label.namespaceURI).toBe('http://www.w3.org/1999/xhtml');
			expect(label.textContent).toBe('Label');
		}
	});

	it('should render static SVG elements with correct namespace', () => {
		function App() @{
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="24"
				height="24"
				fill="none"
				stroke="currentColor"
			>
				<path d="m14 12 4 4 4-4" />
				<circle cx="12" cy="12" r="4" />
				<rect x="4" y="4" width="16" height="16" />
			</svg>
		}

		render(App);

		const svg = container.querySelector('svg');
		const path = container.querySelector('path');
		const circle = container.querySelector('circle');
		const rect = container.querySelector('rect');

		// Verify SVG namespace
		expect(svg).toBeTruthy();
		expect(svg.namespaceURI).toBe('http://www.w3.org/2000/svg');

		// Verify child elements have SVG namespace
		expect(path.namespaceURI).toBe('http://www.w3.org/2000/svg');
		expect(circle.namespaceURI).toBe('http://www.w3.org/2000/svg');
		expect(rect.namespaceURI).toBe('http://www.w3.org/2000/svg');

		// Verify attributes are set correctly
		expect(path.getAttribute('d')).toBe('m14 12 4 4 4-4');
		expect(circle.getAttribute('cx')).toBe('12');
		expect(rect.getAttribute('width')).toBe('16');
	});

	it('should render dynamic SVG paths with for loop (original issue)', () => {
		function App() @{
			const d = [
				'm14 12 4 4 4-4',
				'M18 16V7',
				'm2 16 4.039-9.69a.5.5 0 0 1 .923 0L11 16',
				'M3.304 13h6.392',
			];
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="24"
				height="24"
				fill="none"
				stroke="currentColor"
			>
				@for (const pathData of d) {
					<path d={pathData} />
				}
			</svg>
		}

		render(App);

		const svg = container.querySelector('svg');
		const paths = container.querySelectorAll('path');

		// Verify SVG container
		expect(svg).toBeTruthy();
		expect(svg.namespaceURI).toBe('http://www.w3.org/2000/svg');

		// Critical test: dynamic paths should have correct SVG namespace
		expect(paths.length).toBe(4);
		const expectedPaths = [
			'm14 12 4 4 4-4',
			'M18 16V7',
			'm2 16 4.039-9.69a.5.5 0 0 1 .923 0L11 16',
			'M3.304 13h6.392',
		];
		paths.forEach((path, i) => {
			expect(path.namespaceURI).toBe('http://www.w3.org/2000/svg');
			expect(path.getAttribute('d')).toBe(expectedPaths[i]);
		});

		// Verify paths are actually SVG elements (should have getBBox method)
		// Note: getBBox might not work in test environment, so just check namespace
		paths.forEach((path) => {
			expect(path.namespaceURI).toBe('http://www.w3.org/2000/svg');
			expect(path.tagName.toLowerCase()).toBe('path');
		});
	});

	it('should handle mixed static and dynamic SVG elements', () => {
		function App() @{
			const dynamicPaths = ['M12 2L2 7v10c0 5.55 3.84 10 9 11 5.16-1 9-5.45 9-11V7l-10-5z'];
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="24"
				height="24"
				fill="none"
				stroke="currentColor"
			>
				<circle cx="12" cy="12" r="10" />
				@for (const pathData of dynamicPaths) {
					<path d={pathData} />
				}
				<rect x="4" y="4" width="16" height="16" />
			</svg>
		}

		render(App);

		const svg = container.querySelector('svg');
		const circle = container.querySelector('circle');
		const path = container.querySelector('path');
		const rect = container.querySelector('rect');

		// All elements should have SVG namespace
		expect(svg.namespaceURI).toBe('http://www.w3.org/2000/svg');
		expect(circle.namespaceURI).toBe('http://www.w3.org/2000/svg');
		expect(path.namespaceURI).toBe('http://www.w3.org/2000/svg');
		expect(rect.namespaceURI).toBe('http://www.w3.org/2000/svg');

		// Verify content
		expect(path.getAttribute('d')).toBe(
			'M12 2L2 7v10c0 5.55 3.84 10 9 11 5.16-1 9-5.45 9-11V7l-10-5z',
		);
	});

	it('should handle nested SVG groups with for loops', () => {
		function App() @{
			const items = [
				{ x: '10', y: '10', width: '20', height: '20' },
				{ x: '40', y: '40', width: '20', height: '20' },
			];
			<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
				<g fill="blue">
					@for (const item of items) {
						<rect x={item.x} y={item.y} width={item.width} height={item.height} />
					}
				</g>
			</svg>
		}

		render(App);

		const svg = container.querySelector('svg');
		const g = container.querySelector('g');
		const rects = container.querySelectorAll('rect');

		// Verify namespaces
		expect(svg.namespaceURI).toBe('http://www.w3.org/2000/svg');
		expect(g.namespaceURI).toBe('http://www.w3.org/2000/svg');
		expect(rects.length).toBe(2);

		rects.forEach((rect) => {
			expect(rect.namespaceURI).toBe('http://www.w3.org/2000/svg');
		});

		// Verify attributes
		expect(rects[0].getAttribute('x')).toBe('10');
		expect(rects[0].getAttribute('y')).toBe('10');
		expect(rects[1].getAttribute('x')).toBe('40');
		expect(rects[1].getAttribute('y')).toBe('40');
	});

	it('should handle SVG class attributes correctly', () => {
		function App() @{
			let className = 'svg-element';
			const paths = ['M10 10 L20 20'];
			<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" class={className}>
				@for (const pathData of paths) {
					<path d={pathData} class="dynamic-path" />
				}
				<circle cx="50" cy="50" r="10" class={className} />
			</svg>
		}

		render(App);

		const svg = container.querySelector('svg');
		const path = container.querySelector('path');
		const circle = container.querySelector('circle');

		// Verify namespaces
		expect(svg.namespaceURI).toBe('http://www.w3.org/2000/svg');
		expect(path.namespaceURI).toBe('http://www.w3.org/2000/svg');
		expect(circle.namespaceURI).toBe('http://www.w3.org/2000/svg');

		// Verify class attributes work with SVG elements
		expect(svg.getAttribute('class')).toBe('svg-element');
		expect(path.getAttribute('class')).toBe('dynamic-path');
		expect(circle.getAttribute('class')).toBe('svg-element');

		// SVG elements should NOT have className property set
		expect(svg.className).not.toBe('svg-element'); // className is different for SVG
		expect(path.className).not.toBe('dynamic-path');
	});

	it('should handle namespace transitions with foreignObject', () => {
		function App() @{
			<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">
				<rect x="10" y="10" width="50" height="50" fill="red" />
				<foreignObject x="100" y="100" width="80" height="80">
					<div class="html-content">{'HTML inside SVG'}</div>
				</foreignObject>
				<circle cx="50" cy="150" r="20" fill="blue" />
			</svg>
		}

		render(App);

		const svg = container.querySelector('svg');
		const rect = container.querySelector('rect');
		const foreignObject = container.querySelector('foreignObject');
		const div = container.querySelector('div');
		const circle = container.querySelector('circle');

		// SVG elements should have SVG namespace
		expect(svg.namespaceURI).toBe('http://www.w3.org/2000/svg');
		expect(rect.namespaceURI).toBe('http://www.w3.org/2000/svg');
		expect(foreignObject.namespaceURI).toBe('http://www.w3.org/2000/svg');
		expect(circle.namespaceURI).toBe('http://www.w3.org/2000/svg');

		// HTML content inside foreignObject should have HTML namespace
		expect(div.namespaceURI).toBe('http://www.w3.org/1999/xhtml');
		expect(div.textContent).toBe('HTML inside SVG');
	});

	it('should render SVG with children as svg elements', () => {
		function SVG({ children }: PropsWithChildren<{}>) @{
			<svg
				width={20}
				height={20}
				fill="blue"
				viewBox="0 0 30 10"
				preserveAspectRatio="none"
			>{children}</svg>
		}

		function App() @{
			let isDiamond = true;
			<SVG>
				@if (isDiamond) {
					<polygon points="0,0 30,0 15,10" />
				} @else {
					<polygon points="0,0 30,0 15,10" />
				}
			</SVG>
		}

		render(App);

		const svg = container.querySelector('svg');
		const polygon = container.querySelector('polygon');

		expect(svg.namespaceURI).toBe('http://www.w3.org/2000/svg');
		expect(polygon.namespaceURI).toBe('http://www.w3.org/2000/svg');
	});

	it('should render SVG with props as svg elements', () => {
		function SVG({ Polygon }: PropsWithExtras<{ Polygon: Component }>) @{
			<svg width={20} height={20} fill="blue" viewBox="0 0 30 10" preserveAspectRatio="none">
				<Polygon />
			</svg>
		}

		function App() @{
			<SVG {Polygon} />
		}

		function Polygon() @{
			<polygon points="0,0 30,0 15,10" />
		}

		render(App);

		const svg = container.querySelector('svg');
		const polygon = container.querySelector('polygon');

		expect(svg.namespaceURI).toBe('http://www.w3.org/2000/svg');
		expect(polygon.namespaceURI).toBe('http://www.w3.org/2000/svg');
	});

	it('should render SVG with children as dynamic elements', () => {
		function SVG({ children }: PropsWithChildren<{}>) @{
			<svg
				width={20}
				height={20}
				fill="blue"
				viewBox="0 0 30 10"
				preserveAspectRatio="none"
			>{children}</svg>
		}

		function App() @{
			const dynTag = track('polygon');
			<SVG>
				<{dynTag.value} points="0,0 30,0 15,10" />
			</SVG>
		}

		render(App);

		const svg = container.querySelector('svg');
		const polygon = container.querySelector('polygon');

		expect(svg.namespaceURI).toBe('http://www.w3.org/2000/svg');
		expect(polygon.namespaceURI).toBe('http://www.w3.org/2000/svg');
	});

	it('should render SVG with children as dynamic components', () => {
		function SVG({ children }: PropsWithChildren<{}>) @{
			<svg
				width={20}
				height={20}
				fill="blue"
				viewBox="0 0 30 10"
				preserveAspectRatio="none"
			>{children}</svg>
		}

		function Polygon({ points }: PropsWithExtras<{ points: string }>) @{
			<polygon {points} />
		}

		function App() @{
			const Component = track(() => Polygon);
			<SVG>
				<{Component.value} points="0,0 30,0 15,10" />
			</SVG>
		}

		render(App);

		const svg = container.querySelector('svg');
		const polygon = container.querySelector('polygon');

		expect(svg.namespaceURI).toBe('http://www.w3.org/2000/svg');
		expect(polygon.namespaceURI).toBe('http://www.w3.org/2000/svg');
	});

	it('should render SVG as a dynamic top element with any dynamic children elements', () => {
		function SVG({ children }: PropsWithChildren<{}>) @{
			const tag = track('svg');
			<{tag.value}
				width={100}
				height={50}
				fill="red"
				viewBox="0 0 30 10"
				preserveAspectRatio="none"
			>{children}</{tag.value}>
		}

		function Polygon({ points }: PropsWithExtras<{ points: string }>) @{
			const dynTag = track('polygon');
			<{dynTag.value} {points} />
		}

		function App() @{
			const Component = track(() => Polygon);
			<SVG>
				<{Component.value} points="0,0 30,0 15,10" />
			</SVG>
		}

		render(App);

		const svg = container.querySelector('svg');
		const polygon = container.querySelector('polygon');

		expect(svg.namespaceURI).toBe('http://www.w3.org/2000/svg');
		expect(polygon.namespaceURI).toBe('http://www.w3.org/2000/svg');
	});

	it('should compare static vs dynamic SVG rendering (original problem case)', () => {
		function App() @{
			const d = [
				'm14 12 4 4 4-4',
				'M18 16V7',
				'm2 16 4.039-9.69a.5.5 0 0 1 .923 0L11 16',
				'M3.304 13h6.392',
			];
			<div class="container">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="24"
					height="24"
					fill="none"
					stroke="currentColor"
					class="dynamic-svg"
				>
					@for (const path of d) {
						<path d={path} />
					}
				</svg>

				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="24"
					height="24"
					fill="none"
					stroke="currentColor"
					class="static-svg"
				>
					<path d="m14 12 4 4 4-4" />
					<path d="M18 16V7" />
					<path d="m2 16 4.039-9.69a.5.5 0 0 1 .923 0L11 16" />
					<path d="M3.304 13h6.392" />
				</svg>
			</div>
		}

		render(App);

		const dynamicSvg = container.querySelector('.dynamic-svg');
		const staticSvg = container.querySelector('.static-svg');
		const dynamicPaths = dynamicSvg.querySelectorAll('path');
		const staticPaths = staticSvg.querySelectorAll('path');

		// Both SVGs should have correct namespace
		expect(dynamicSvg.namespaceURI).toBe('http://www.w3.org/2000/svg');
		expect(staticSvg.namespaceURI).toBe('http://www.w3.org/2000/svg');

		// Both should have same number of paths
		expect(dynamicPaths.length).toBe(4);
		expect(staticPaths.length).toBe(4);

		// All paths should have SVG namespace
		dynamicPaths.forEach((path) => {
			expect(path.namespaceURI).toBe('http://www.w3.org/2000/svg');
		});
		staticPaths.forEach((path) => {
			expect(path.namespaceURI).toBe('http://www.w3.org/2000/svg');
		});

		// Dynamic and static should have identical path data
		dynamicPaths.forEach((path, i) => {
			expect(path.getAttribute('d')).toBe(staticPaths[i].getAttribute('d'));
		});

		// Critical test: all paths should be proper SVG elements
		dynamicPaths.forEach((path) => {
			expect(path.namespaceURI).toBe('http://www.w3.org/2000/svg');
			expect(path.tagName.toLowerCase()).toBe('path');
		});
		staticPaths.forEach((path) => {
			expect(path.namespaceURI).toBe('http://www.w3.org/2000/svg');
			expect(path.tagName.toLowerCase()).toBe('path');
		});
	});

	it('should render dynamic SVG elements dispatched via a switch inside a for loop', () => {
		function App() @{
			const iconNodes: [string, Record<string, string>][] = [
				['path', { d: 'm14 12 4 4 4-4' }],
				['circle', { cx: '12', cy: '12', r: '4' }],
				['path', { d: 'M18 16V7' }],
			];
			<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24">
				@for (const [tag, attrs] of iconNodes) {
					@switch (tag) {
						@case 'path': {
							<path {...attrs} />
						}
						@case 'circle': {
							<circle {...attrs} />
						}
					}
				}
			</svg>
		}

		render(App);

		const svg = container.querySelector('svg');
		expect(svg).toBeTruthy();
		expect(svg.namespaceURI).toBe('http://www.w3.org/2000/svg');

		const paths = svg.querySelectorAll('path');
		const circles = svg.querySelectorAll('circle');

		expect(paths.length).toBe(2);
		expect(circles.length).toBe(1);

		paths.forEach((path) => {
			expect(path.namespaceURI).toBe('http://www.w3.org/2000/svg');
		});
		expect(circles[0].namespaceURI).toBe('http://www.w3.org/2000/svg');

		expect(paths[0].getAttribute('d')).toBe('m14 12 4 4 4-4');
		expect(circles[0].getAttribute('cx')).toBe('12');
		expect(paths[1].getAttribute('d')).toBe('M18 16V7');
	});
});
