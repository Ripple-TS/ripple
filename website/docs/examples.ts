export const examples: Array<{ title: string; code: string }> = [
	{
		title: 'Hello World',
		code: `
export default function App() {
	return <div>Hello World</div>
}`,
	},
	{
		title: 'Dynamic Content',
		code: `
export default function App() @{
	const message = "Hello Ripple!";
	<div>{message}</div>
}`,
	},
	{
		title: 'Styling',
		code: `import { track } from 'ripple';

export default function App() @{
	<>
		<div class="message">Hello Ripple!</div>

		<DynamicStyleValues />

		<style>
			.message {
				color: #3e95ff;
				font-weight: bold;
				font-size: 2rem;
				text-align: center;
				padding: 1rem;
			}
		</style>
	</>
}

function DynamicStyleValues() @{
  const color = track('#3e95ff');

  <>
		<p class="notice" style={{ '--notice-color': color.value }}>
			Hello Ripple!
		</p>

		<style>
			.notice {
				color: var(--notice-color);
				font-weight: bold;
				background-color: #eee;
			}
		</style>
	</>
}

function DynamicClasses() @{
  const includeBaz = track(true);
	const count = track(3);

  <>
		<p class={{ foo: true, bar: false, baz: includeBaz.value }}> // becomes: class="foo baz"
			Hello Ripple!
		</p>

		<p class={['foo', {baz: false}, 0 && 'bar', [true && 'bat'] ]}> // becomes: class="foo bat"
			Hello Ripple!
		</p>

		<p class={['foo', {bar: count.value > 2}, count.value > 3 && 'bat']}> // becomes: class="foo bar"
			Hello Ripple!
		</p>
	</>
}`,
	},
	{
		title: 'Scoped Styles & Themes',
		code: `import { track } from 'ripple';

// A style block styles the elements beside it and everything below them,
// never the element that contains it. Assigned to a variable it becomes a
// theme: an object with $class (its hash class) plus one key per class
// selector. Exported, applied, or $class-read blocks keep every selector.
const base = <style>
	article {
		font-family: system-ui, sans-serif;
		border-radius: 12px;
		padding: 1rem 1.25rem;
	}
	h2 {
		margin: 0 0 0.5rem;
		font-size: 1.1rem;
	}
</style>;

// A theme can apply another theme: light.$class carries base's hash too.
const light = <style apply={base}>
	article {
		background: #f6f7fb;
		color: #1a1c2c;
	}
	.accent {
		color: #5b4bff;
	}
</style>;

const dark = <style apply={base}>
	article {
		background: #1a1c2c;
		color: #f6f7fb;
	}
	.accent {
		color: #ffb454;
	}
</style>;

// Reading accent.$class makes this block a theme, so its element rules
// survive, and only the elements that carry accent.$class pick them up.
const accent = <style>
	p {
		border-left: 3px solid #5b4bff;
		padding-left: 0.5rem;
	}
	strong {
		color: #5b4bff;
	}
</style>;

// A child puts a passed class on the elements it chooses; its own scope
// hash follows, so its local rules still reach them.
function Footnote({ parentClass }: { parentClass: string }) @{
	<>
		<style>
			p {
				margin: 0;
				font-size: 0.9rem;
			}
		</style>
		<p class={parentClass}>
			<strong class={parentClass}>Footnote:</strong> a child opted in through a prop.
		</p>
	</>
}

// Each card applies a theme to its own scope: the theme's article and h2
// rules reach every element here, while the card's local rules stay local.
function LightCard() @{
	<>
		<style apply={light}>
			p {
				margin: 0;
			}
		</style>
		<article>
			<h2>Light card</h2>
			<p>{'Accent class: ' + light.accent}</p>
			<p class={light.accent}>A class-map entry carries its hash.</p>
		</article>
	</>
}

function DarkCard() @{
	<>
		<style apply={dark}>
			p {
				margin: 0;
			}
		</style>
		<article>
			<h2>Dark card</h2>
			<p class={dark.accent}>Same markup, other theme.</p>
		</article>
	</>
}

export default function App() @{
	const expanded = track(false);

	<>
		<style>
			.stack {
				display: grid;
				gap: 0.75rem;
				justify-items: start;
			}
			button {
				padding: 0.4rem 0.9rem;
				border-radius: 8px;
				border: 1px solid #8886;
				background: transparent;
				color: inherit;
				cursor: pointer;
			}
		</style>
		<div class="stack">
			<LightCard />
			<DarkCard />
			<p class={accent.$class}>Opted in with accent.$class; apply would stamp every element.</p>
			<p>An untouched sibling.</p>
			<Footnote parentClass={accent.$class} />
			<button onClick={() => (expanded.value = !expanded.value)}>
				{expanded.value ? 'Collapse' : 'Expand'}
			</button>
			@if (expanded.value) {
				<>
					<style>
						.note {
							color: #17803d;
						}
					</style>
					<p class="note">Rules in a branch reach only that branch.</p>
				</>
			} @else {
				<>
					<style>
						.note {
							opacity: 0.6;
						}
					</style>
					<p class="note">Same class name, a different scope.</p>
				</>
			}
		</div>
	</>
}`,
	},
	{
		title: 'Components',
		code: `
function Card() @{
	<>
		<div class="card">
			<p>Card content here</p>
		</div>
		<style>
			.card {
				color: black;
				background: white;
				padding: 20px;
				margin: 20px;
				border-radius: 5px;
				border: 1px solid lightgray;
				box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
			}
		</style>
	</>
}

export default function App() {
  return <Card />
}`,
	},
	{
		title: 'Props',
		code: `
export default function App() @{
		const message = "Another card";

		const props = {
			message: "A clickable card",
			class: "clickable",
			onClick: () => { alert("Card clicked!") }
		};

		<>
			<Card message="A Card" />
			<Card {message} /> // props shorthand
			<Card {...props} /> // props spread
		</>
}

function Card(props: { message: string, class?: string, onClick?: () => void }) @{
	<>
		<div class={\`card \${props.class}\`} onclick={props.onClick || (() => {})}>
			<p>{props.message}</p>
		</div>
		<style>
			.card {
				padding: 20px;
				margin: 20px;
				border-radius: 5px;
				border: 1px solid lightgray;
				box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
			}
			.clickable:hover {
				cursor: pointer;
				background: #f5f5f5;
				color: #000;
			}
		</style>
	</>
}
`,
	},
	{
		title: 'Children',
		code: `import type { Children } from 'ripple';

function Card(props: { children: Children }) @{
	<>
		<div class="card">{props.children}</div>
		<style>
			.card {
				color: black;
				background: white;
				padding: 20px;
				margin: 20px;
				border-radius: 5px;
				border: 1px solid lightgray;
				box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
			}
		</style>
	</>
}

// Usage
export default function App() {
  return <Card><p>Card content here</p></Card>
}
`,
	},
	{
		title: 'Named Children',
		code: `import type { Component } from 'ripple';

function Composite({ PropComp, InlineComp }: { PropComp: Component; InlineComp: Component }) {
  return <>
		<PropComp />
		<InlineComp />
  </>;
}

function Separate() {
  return <p>I'm a separate component.</p>
}

function InlineComp() {
  return <p>I'm an inline component.</p>
}

export default function App() {
  return <Composite PropComp={Separate} InlineComp={InlineComp} />
}
`,
	},
	{
		title: 'Child Composition',
		code: `import type { Children, Component } from 'ripple';

function Card({ children, Header, Footer }: { children: Children; Header?: Component; Footer?: Component }) {
  return <fieldset>
		@if (Header) {
			<>
				<Header />
				<hr />
			</>
		}
		{children}
		@if (Footer) {
			<>
				<hr />
				<Footer />
			</>
		}
	</fieldset>
}

function CustomHeader() {
  return <h1>Card Title</h1>
}

function Footer() {
  return <p>Card footer</p>
}

export default function App() {
  return <Card Header={CustomHeader} Footer={Footer}>
		<p>Card content here</p>
	</Card>
}
`,
	},
	{
		title: 'Portal Component',
		code: `import { Portal } from 'ripple';

export default function App() {
  return <div class="app">
		<h1>My App</h1>

		{/* This will render inside document.body, not inside the .app div */}
		<Portal target={document.body}>
			<div class="modal">
				<h2>I am rendered in document.body!</h2>
				<p>This content escapes the normal component tree.</p>
			</div>
		</Portal>
	</div>
}
`,
	},
	{
		title: 'If Statements',
		code: `
function Truthy({ x }) {
	return <div>
    @if (x) {
      <span>x is truthy</span>
    } @else {
      <span>x is falsy</span>
    }
  </div>
}

export default function App() @{
  <>
		<Truthy x={true} />
		<Truthy x={false} />
  </>
} 
`,
	},
	{
		title: 'Switch Statements',
		code: `import { track } from 'ripple';

export default function App() @{
	const count = track(1);

  <>
		<button onClick={() => count.value++}>Increment</button>

		@switch (count.value) {
			@case 1: {
				<div>Count is 1</div>
			}
			@case 2: {
				<div>Count is 2</div>
			}
			@default: {
				<div>Count is other</div>
			}
		}
  </>
}
`,
	},
	{
		title: 'For Loops',
		code: `
function List({ items }) {
	return <ul>
		@for (const item of items) {
			<li>{item}</li>
		}
	</ul>
}

function ListWithIndex({ items }) {
  return <ul>
    @for (const item of items; index i) {
      <li>{i}: {item}</li>
    }
  </ul>
}

export default function App() @{
	const items = ['apple', 'banana', 'cherry']
  <>
		<List {items} />
		<ListWithIndex {items} />
  </>
}
`,
	},
	{
		title: 'Try Catch',
		code: `
const reportError = (e) => {
	console.warn(e);
}

function ComponentThatFails(props) {
  return <div>{props.foo.bar}</div>
}

export default function ErrorBoundary() @{
  <div>
    @try {
      <ComponentThatFails />
    } @catch (e) {
      reportError(e);

      <div>An error occurred! {e.message}</div>
    }
  </div>
}`,
	},
	{
		title: 'Async',
		code: `import { trackAsync } from 'ripple';

function AsyncComponent() {
	const message = trackAsync(() => new Promise((resolve) => {
		setTimeout(() => resolve('Async content loaded!'), 2000);
	}));

  return <p>{message.value}</p>
}

export default function SuspenseBoundary() @{
  @try {
    <AsyncComponent />
  } @pending {
    <p>Loading...</p>
  }
}
`,
	},
	{
		title: 'Raw HTML',
		code: `
export default function App() @{
	let source = \`
		<h1>My Blog Post</h1>
		<p>Hi! I like JS and Ripple.</p>
	\`

  <article innerHTML={source} />
}
`,
	},
	{
		title: 'Reactive Variables',
		code: `import { track } from 'ripple';

export default function Counter() @{
	const count = track(0);  // Reactive variable
	const double = track(() => count.value * 2);  // Derived reactive value
	const quadruple = track(() => double.value * 2);

  <>
		<div class="container">
			<p>Count: {count.value}</p>
			<p>Double: {double.value}</p>
			<p>Quadruple: {quadruple.value}</p>
			<button onClick={() => count.value++}>Increment</button>
			<button onClick={() => count.value = 0}>Reset</button>
		</div>

		<style>
			.container {
				text-align: center;
			}
			button {
				margin: 20px;
				padding: 10px;
			}
		</style>
  </>
}`,
	},
	{
		title: 'Effects',
		code: `import { effect, track } from 'ripple';
import confetti from 'canvas-confetti';

export default function App() @{
  const count = track(0);

  effect(() => {
    console.log(count.value);
    if (count.value > 0) {
      confetti();
    }
  });

	<button onClick={() => count.value++}>Increment</button>
}
`,
	},
	{
		title: 'Simple Reactive Array',
		code: `import { effect, track } from 'ripple';

export default function App() @{
	const first = track(1);
	const second = track(2);
	const arr = [first, second];

	const total = track(() => arr.reduce((a, item) => a + item.value, 0));

	effect(() => {
		console.log(total.value);
	});

	<div>
		<button onClick={() => first.value++}>First: {first.value}</button>
		<button onClick={() => second.value++}>Second: {second.value}</button>
		<p>Total: {total.value}</p>
	</div>
}
`,
	},
	{
		title: 'Fully Reactive Array',
		code: `import { RippleArray, track } from 'ripple';

export default function App() @{
  // create a RippleArray using the constructor
  const arr = new RippleArray(1, 2, 3);
	const sum = track(() => arr.reduce((a, b) => a + b, 0));
	const count = track(3);
	const inc = () => count.value++;
	const dec = () => { if (count.value > 0) count.value-- };

  // using the new constructor
  // const arr = new RippleArray(1, 2, 3);

  // using static from method
  // const arr = RippleArray.from([1, 2, 3]);

  // using static of method
  // const arr = RippleArray.of(1, 2, 3);
	console.log(arr instanceof Array);

  <>
		// array methods can be used as usual
		<p>arr: {arr.join(", ")}</p>
		<p>double: {arr.map(x => x * 2).join(", ")}</p>
		<p>even: {arr.filter(x => x % 2 === 0).join(", ")}</p>

			// reactive assignment
			<p>sum: {sum.value}</p>

			<button onClick={() => { dec(); arr.pop(); }}>pop</button>
			<button onClick={() => { inc(); arr.push(count.value); }}>push</button>

		<style>
			button {
				margin: 5px;
			}
		</style>
  </>
}
`,
	},
	{
		title: 'Reactive Object',
		code: `import { RippleObject } from 'ripple';

export default function App() @{
  const obj = new RippleObject({a: 0})

  obj.a = 0;

  <>
		<pre>obj.a is: {obj.a}</pre>
		<pre>obj.b is: {obj.b}</pre>
		<button onClick={() => { obj.a++; obj.b = obj.b ?? 5; obj.b++; }}>Increment</button>
  </>
}
`,
	},
	{
		title: 'Reactive Set',
		code: `import { RippleSet, track } from 'ripple';

export default function App() @{
  const set = new RippleSet([1, 2, 3]);
	const has = track(() => set.has(2));

  <>
		// direct usage
		<p>Direct usage: set contains 2: {set.has(2)}</p>

		// reactive assignment
		<p>Assigned usage: set contains 2: {has.value}</p>

		<button onClick={() => set.delete(2)}>Delete 2</button>
		<button onClick={() => set.add(2)}>Add 2</button>
  </>
}
`,
	},
	{
		title: 'Reactive Map',
		code: `import { RippleMap, track } from 'ripple';

export default function App() @{
  const map = new RippleMap([[1,1], [2,2], [3,3], [4,4]]);
	const has = track(() => map.has(2));

	<>
		// direct usage
		<p>Direct usage: map has an item with key 2: {map.has(2)}</p>

		// reactive assignment
		<p>Assigned usage: map has an item with key 2: {has.value}</p>

		<button onClick={() => map.delete(2)}>Delete item with key 2</button>
		<button onClick={() => map.set(2, 2)}>Add key 2 with value 2</button>
  </>
}
`,
	},
	{
		title: 'Reactive Date',
		code: `import { RippleDate, track } from 'ripple';

export default function App() @{
  const date = new RippleDate(2025, 0, 1, 12, 0, 0);
	const year = track(() => date.getFullYear());
	const month = track(() => date.getMonth());

  <>
		// direct usage
		<p>Direct usage: Current year is {date.getFullYear()}</p>
		<p>ISO String: {date.toISOString()}</p>

		// reactive assignment
		<p>Assigned usage: Year {year.value}, Month {month.value}</p>

		<button onClick={() => date.setFullYear(2026)}>Change to 2026</button>
		<button onClick={() => date.setMonth(11)}>Change to December</button>
  </>
}
`,
	},
	{
		title: 'Tracked with get/set',
		code: `import { track } from 'ripple';

export default function App() @{
  const count = track(0,
    (current) => {
      console.log(current);
      return current;
    },
    (next, prev) => {
      console.log(prev);
      if (typeof next === 'string') {
        next = Number(next);
      }

      return next;
    }
  );

	<>
		<div class="container">
			<p>{count.value}</p>
			<button onClick={() => count.value++}>Increment</button>
			<button onClick={() => count.value = 0}>Reset</button>
		</div>

		<style>
			.container {
				text-align: center;
			}
			button {
				margin: 20px;
				padding: 10px;
			}
		</style>
  </>
}
`,
	},
	{
		title: 'Transporting Reactivity',
		code: `import { effect, track, type Tracked } from 'ripple';

function createDouble(count: Tracked<number>) {
  const double = track(() => count.value * 2);

  effect(() => {
    console.log('Count:', count.value)
  });
  return double;
}

function createQuad(count: Tracked<number>) {
  const quad = track(() => count.value * 4);
  effect(() => {
    console.log('Count:', count.value)
  });
  return quad;
}

export default function App() @{
  const count = track(0);
  const double = createDouble(count);
	const quad = createQuad(count);

	<>
		<p>Count: {count.value}</p>
		<p>Double: {double.value}</p>
		<p>Quadruple: {quad.value}</p>
		<button onClick={() => { count.value++; }}>Increment Count</button>
  </>
}
`,
	},
	{
		title: 'Dynamic Components',
		code: `import { track, type Component, type Derived } from 'ripple';

export default function App() @{
  const swapMe = track(() => Child1, undefined, true);
  // A plain Tracked works too. Create it empty and assign the component,
  // because track(Child1) would treat the function as a computation:
  // const swapMe = track<Component>();
  // swapMe.value = Child1;

  <>
		<Child {swapMe} />

		<button onClick={() => swapMe.value = swapMe.value === Child1 ? Child2 : Child1}>
			Swap Component
		</button>
  </>
}

function Child({ swapMe }: {swapMe: Derived<Component>}) {
  return <{swapMe.value} />
}

function Child1(props) {
  return <pre>I am child 1</pre>
}

function Child2(props) {
  return <pre>I am child 2</pre>
}
`,
	},
	{
		title: 'Component Transport Pattern',
		code: `import { track, type Children, type Derived, type Component } from 'ripple';

export default function App() @{
  const tracked_basic = track(() => basic);
  const obj = {
    tracked_basic,
  };
  const ripple_object = track(obj);
  const Button = track(() => SomeButton);
  const AnotherButton = track(() => SomeButton);

	<>
		<{ripple_object.value.tracked_basic.value} />
		<Child {Button}>Child Button</Child>
		<AnotherChild Button={AnotherButton}>Another Child Button</AnotherChild>
  </>
}

function Child({ Button, children }: { Button: Derived<Component>; children: Children }) {
  return <{Button.value}>{children}</{Button.value}>
}

function AnotherChild({ Button, children }: { Button: Derived<Component>; children: Children }) {
  return <{Button.value}>{children}</{Button.value}>
}

function SomeButton({ children }) {
  return <button onClick={() => alert('Clicked')}>{children}</button>
}

function basic() {
  return <div>Basic Component</div>
}
`,
	},
	{
		title: 'Untracking Reactivity',
		code: `import { effect, track, untrack } from 'ripple';

export default function App() @{
  const count = track(10);
  const double = track(() => count.value * 2);
  const quadruple = track(() => double.value * 2);

  effect(() => {
    // This effect will never fire again, as we've untracked the only dependency it has
    console.log(untrack(() => quadruple.value));
	})

	<>
		<p>Count: {count.value}</p>
		<p>Double: {double.value}</p>
		<p>Quadruple: {quadruple.value}</p>
		<button onClick={() => { count.value++; }}>Increment Count</button>
  </>
}
`,
	},
	{
		title: 'Events',
		code: `import { effect, on, track } from 'ripple';

export default function App() @{
  const message = track('');

	effect(() => {
    // on component mount
    const removeListener = on(window, 'resize', () => {
      console.log('Window resized!');
    });

    // return the removeListener when the component unmounts
    return removeListener;
  });

	<div>
		<p>Try resizing the window!</p>
    <button onClick={() => message.value = 'Clicked!'}>Click me</button>
    <input onInput={(e) => message.value = e.target.value} />
    <p>{message.value}</p>
  </div>
}
`,
	},
	{
		title: 'DOM References',
		code: `import { track } from 'ripple';

export default function App() @{
  const div = track();

  const divRef = (node) => {
    div.value = node;
    console.log("mounted", node);

    return () => {
      div.value = undefined;
      console.log("unmounted", node);
    };
  };

	<div ref={divRef}>Hello world</div>
}
`,
	},
	{
		title: 'createRefKey',
		code: `import { createRefKey, track } from 'ripple';

export default function App() @{
  const value = track('');

  const props = {
    id: "example",
    value: value.value,
    [createRefKey()]: (node) => {
      const onInput = (e) => {
        value.value = e.target.value;
        console.log(value.value);
      };

      node.addEventListener('input', onInput);

      return () => {
        node.removeEventListener('input', onInput);
      }
    }
  };

	<>
		<input type="text" {...props} />
		<div>{value.value}</div>
  </>
}
`,
	},
	{
		title: 'Context',
		code: `import { Context } from 'ripple';

const MyContext = new Context(null);

export default function Parent() @{
	const value = MyContext.get();

	// Context is read in the Parent component, but hasn't yet
	// been set, so we fallback to the initial context value.
	// So the value is \`null\`
	console.log(value);

	// Context is set in the Parent component
	MyContext.set("Hello from context!");

	<Child />
}

function Child() @{

	// Context is read in the Child component
	const value = MyContext.get();

	// value is "Hello from context!"
	console.log(value);

  <p>Value in Child: {value}</p>
}
`,
	},
];
