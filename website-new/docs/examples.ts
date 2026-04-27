export const examples: Array<{ title: string; code: string }> = [
	{
		title: 'Hello World',
		code: `export default component App() {
  <div>"Hello World"</div>
}`,
	},
	{
		title: 'Dynamic Content',
		code: `export default component App() {
	const message = "Hello Ripple!";

  <div>{message}</div>
}`,
	},
	{
		title: 'Styling',
		code: `import { track } from 'ripple';

export default component App() {
	<div class="message">"Hello Ripple!"</div>

  <InlineStyles />

	<style>
		.message {
			color: #3e95ff;
			font-weight: bold;
			font-size: 2rem;
			text-align: center;
			padding: 1rem;
		}
	</style>
}

component InlineStyles() {
  let color = track('#3e95ff');

  <p style={\`color: \${@color}; font-weight: bold; background-color: #eee\`}>
		"Hello Ripple!"
  </p>
  <p style={{ color: @color, fontWeight: 'bold', 'background-color': '#eee' }}>
		"Hello Ripple!"
  </p>

  const style = {
    @color,
    fontWeight: 'bold',
    'background-color': '#eee',
  };

  // using object spread
	<p style={{...style}}>"Hello Ripple!"</p>

  // using object directly
	<p style={style}>"Hello Ripple!"</p>
}

component DynamicClasses() {
  let includeBaz = track(true);
  <p class={{ foo: true, bar: false, baz: @includeBaz }}> // becomes: class="foo baz"
		"Hello Ripple!"
  </p>

  <p class={['foo', {baz: false}, 0 && 'bar', [true && 'bat'] ]}> // becomes: class="foo bat"
		"Hello Ripple!"
  </p>

  let count = track(3);
  <p class={['foo', {bar: @count > 2}, @count > 3 && 'bat']}> // becomes: class="foo bar"
		"Hello Ripple!"
  </p>
}
`,
	},
	{
		title: 'Components',
		code: `component Card() {
	<div class="card">
		<p>"Card content here"</p>
	</div>
	<style>
		.card {
      background: white;
      padding: 20px;
      margin: 20px;
      border-radius: 5px;
      border: 1px solid lightgray;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
		}
	</style>
}

export default component App() {
	<Card />
}
		`,
	},
	{
		title: 'Props',
		code: `export default component App() {
	<Card message={"A Card"} />

	const message = "Another card";
	<Card {message} /> // props shorthand

	const props = {
    message: "A clickable card",
    className: "clickable",
    onClick: () => { alert("Card clicked!") }
  };
	<Card {...props} /> // props spread
}

component Card(props: { message: string, className?: string, onClick?: () => void }) {
	<div class={\`card \${props.className}\`} onclick={props.onClick || (() => {})}>
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
}
`,
	},
	{
		title: 'Children',
		code: `import type { Children } from 'ripple';

component Card(props: { children: Children }) {
  <div class="card">
    {props.children}
  </div>
}

// Usage
export default component App() {
	<Card>
		<p>"Card content here"</p>
	</Card>
}
`,
	},
	{
		title: 'Named Children',
		code: `component Composite({ PropComp, InlineComp }) {
	<PropComp />
	<InlineComp />
}

component Separate() {
	<p>{\`I'm a separate component.\`}</p>
}

export default component App() {
	component InlineComp() {
		<p>{\`I'm an inline component.\`}</p>
	}

	<Composite PropComp={Separate} {InlineComp} />
}
`,
	},
	{
		title: 'Child Composition',
		code: `component Card({ children, Header, Footer }) {
	<fieldset>
		<Header />
		<hr />
		{children}
		<hr />
		<Footer />
	</fieldset>
}

component CustomHeader() {
	<h1>"Card Title"</h1>
}

export default component App() {
	component Footer() {
		<p>"Card footer"</p>
	}

	<Card Header={CustomHeader} {Footer}> // <- Header and Footer passed in as props
		<p>"Card content here"</p>
	</Card>
}
`,
	},
	{
		title: 'Portal Component',
		code: `import { Portal } from 'ripple';

export default component App() {
	<div class="app">
		<h1>"My App"</h1>

		{/* This will render inside document.body, not inside the .app div */}
		<Portal target={document.body}>
			<div class="modal">
				<h2>"I am rendered in document.body!"</h2>
				<p>"This content escapes the normal component tree."</p>
			</div>
		</Portal>
	</div>
}
`,
	},
	{
		title: 'If Statements',
		code: `component Truthy({ x }) {
  <div>
    if (x) {
      <span>{'x is truthy'}</span>
    } else {
      <span>{'x is falsy'}</span>
    }
  </div>
}

export default component App() {
  <Truthy x={true} />
  <Truthy x={false} />
}
`,
	},
	{
		title: 'Switch Statements',
		code: `import { track } from 'ripple';

export default component App() {
	let count = track(1);

	<button onClick={() => @count++}>"Increment"</button>

	switch (@count) {
		case 1:
			<div>"Count is 1"</div>
			break;
		case 2:
			<div>"Count is 2"</div>
			break;
		default:
			<div>"Count is other"</div>
	}
}
`,
	},
	{
		title: 'For Loops',
		code: `component List({ items }) {
	<ul>
		for (const item of items) {
			<li>{item}</li>
		}
	</ul>
}

component ListWithIndex({ items }) {
  <ul>
    for (const item of items; index i) {
      <li>{\`\${i}: \${item}\`}</li>
    }
  </ul>
}

export default component App() {
  const items = ['apple', 'banana', 'cherry']
	<List {items} />
	<ListWithIndex {items} />
}
`,
	},
	{
		title: 'Try Catch',
		code: `const reportError = (e) => {
	console.warn(e);
}

component ComponentThatFails(props) {
	<div>{props.foo.bar}</div>
}

export default component ErrorBoundary() {
  <div>
    try {
      <ComponentThatFails />
    } catch (e) {
      reportError(e);

      <div>{'An error occurred! ' + e.message}</div>
    }
  </div>
}`,
	},
	{
		title: 'Async',
		code: `import { trackAsync } from 'ripple';

component AsyncComponent() {
	let &[message] = trackAsync(() =>
		new Promise((resolve) => {
			setTimeout(() => resolve('Async content loaded!'), 2000);
		}),
	);

	<p>{message}</p>
}

export default component SuspenseBoundary() {
	try {
		<AsyncComponent />
	} pending {
		<p>"Loading..."</p>
	}
}
`,
	},
	{
		title: 'Raw HTML',
		code: `export default component App() {
	let source = \`
<h1>My Blog Post</h1>
<p>Hi! I like JS and Ripple.</p>
\`

	<article>
		{html source}
	</article>
}
`,
	},
	{
		title: 'Reactive Variables',
		code: `import { track } from 'ripple';

export default component Counter() {
	let count = track(0);  // Reactive variable
	let double = track(() => @count * 2);  // Derived reactive value
	let quadruple = track(() => @double * 2);

	<div class="container">
		<p>"Count: "{@count}</p>
		<p>"Double: "{@double}</p>
		<p>"Quadruple: "{@quadruple}</p>
		<button onClick={() => @count++}>"Increment"</button>
		<button onClick={() => @count = 0}>"Reset"</button>
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
}`,
	},
	{
		title: 'Effects',
		code: `import { effect, track } from 'ripple';
import confetti from 'canvas-confetti';

export default component App() {
  let count = track(0);

  effect(() => {
    console.log(@count);
    if (@count > 0) {
      confetti();
    }
  });

	<button onClick={() => @count++}>"Increment"</button>
}
`,
	},
	{
		title: 'Simple Reactive Array',
		code: `import { effect, track } from 'ripple';

export default component App() {
	let &[first, firstTracked] = track(1);
	let &[second, secondTracked] = track(2);
	const arr = [firstTracked, secondTracked];

	const &[total] = track(() => arr.reduce((a, item) => a + item.value, 0));

	effect(() => {
		console.log(total);
	});

	<div>
		<button onClick={() => first++}>{'First: '}{first}</button>
		<button onClick={() => second++}>{'Second: '}{second}</button>
		<p>{'Total: '}{total}</p>
	</div>
}
`,
	},
	{
		title: 'Fully Reactive Array',
		code: `import { RippleArray, track } from 'ripple';

export default component App() {
  // create a RippleArray using the constructor
  const arr = new RippleArray(1, 2, 3);

  // using the new constructor
  // const arr = new RippleArray(1, 2, 3);

  // using static from method
  // const arr = RippleArray.from([1, 2, 3]);

  // using static of method
  // const arr = RippleArray.of(1, 2, 3);

  // array methods can be used as usual
  <p>{"arr: "}{arr.join(", ")}</p>
  <p>{"double: "}{arr.map(x => x * 2).join(", ")}</p>
  <p>{"even: "}{arr.filter(x => x % 2 === 0).join(", ")}</p>
  console.log(arr instanceof Array);

  // reactive assignment
  let sum = track(() => arr.reduce((a, b) => a + b, 0));
  <p>{"sum: "}{@sum}</p>

  let count = track(3);
  const inc = () => @count++;
  const dec = () => { if (@count > 0) @count-- };
  <button onClick={() => { dec(); arr.pop(); }}>{"pop"}</button>
  <button onClick={() => { inc(); arr.push(@count); }}>{"push"}</button>

  <style>
    button {
      margin: 5px;
    }
  </style>
}
`,
	},
	{
		title: 'Reactive Object',
		code: `import { RippleObject } from 'ripple';

export default component App() {
  const obj = new RippleObject({a: 0})

  obj.a = 0;

	<pre>"obj.a is: "{obj.a}</pre>
	<pre>"obj.b is: "{obj.b}</pre>
	<button onClick={() => { obj.a++; obj.b = obj.b ?? 5; obj.b++; }}>"Increment"</button>
}
`,
	},
	{
		title: 'Reactive Set',
		code: `import { RippleSet, track } from 'ripple';

export default component App() {
  const set = new RippleSet([1, 2, 3]);

  // direct usage
  <p>{"Direct usage: set contains 2: "}{set.has(2)}</p>

  // reactive assignment
  let has = track(() => set.has(2));
  <p>{"Assigned usage: set contains 2: "}{@has}</p>

  <button onClick={() => set.delete(2)}>{"Delete 2"}</button>
  <button onClick={() => set.add(2)}>{"Add 2"}</button>
}
`,
	},
	{
		title: 'Reactive Map',
		code: `import { RippleMap, track } from 'ripple';

export default component App() {
  const map = new RippleMap([[1,1], [2,2], [3,3], [4,4]]);

  // direct usage
  <p>{"Direct usage: map has an item with key 2: "}{map.has(2)}</p>

  // reactive assignment
  let has = track(() => map.has(2));
  <p>{"Assigned usage: map has an item with key 2: "}{@has}</p>

  <button onClick={() => map.delete(2)}>{"Delete item with key 2"}</button>
  <button onClick={() => map.set(2, 2)}>{"Add key 2 with value 2"}</button>
}
`,
	},
	{
		title: 'Reactive Date',
		code: `import { RippleDate, track } from 'ripple';

export default component App() {
  const date = new RippleDate(2025, 0, 1, 12, 0, 0);

  // direct usage
  <p>{"Direct usage: Current year is "}{date.getFullYear()}</p>
  <p>{"ISO String: "}{date.toISOString()}</p>

  // reactive assignment
  let year = track(() => date.getFullYear());
  let month = track(() => date.getMonth());
  <p>{"Assigned usage: Year "}{@year}{", Month "}{@month}</p>

  <button onClick={() => date.setFullYear(2026)}>{"Change to 2026"}</button>
  <button onClick={() => date.setMonth(11)}>{"Change to December"}</button>
}
`,
	},
	{
		title: 'Tracked with get/set',
		code: `import { track } from 'ripple';

export default component App() {
  let count = track(0,
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

  <div class="container">
    <p>{@count}</p>
	<button onClick={() => @count++}>"Increment"</button>
	<button onClick={() => @count = 0}>"Reset"</button>
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
}
`,
	},
	{
		title: 'Transporting Reactivity',
		code: `import { effect, track } from 'ripple';

function createDouble([ count ]) {
  const double = track(() => @count * 2);
  effect(() => {
    console.log('Count:', @count)
  });
  return [ double ];
}

function createQuad({ count }) {
  const quad = track(() => @count * 4);
  effect(() => {
    console.log('Count:', @count)
  });
  return { quad };
}

export default component App() {
  let count = track(0);

  const [ double ] = createDouble([ count ]); // array
  <p>{'Double: ' + @double}</p>

  const { quad } = createQuad({ count }); // object
  <p>{'Quadruple: ' + @quad}</p>

	<button onClick={() => { @count++; }}>"Increment"</button>
}
`,
	},
	{
		title: 'Dynamic Components',
		code: `import { track } from 'ripple';

export default component App() {
  let swapMe = track(() => Child1);

  <Child {swapMe} />

  <button onClick={() => @swapMe = @swapMe === Child1 ? Child2 : Child1}>
		{'Swap Component'}
	</button>
}

component Child({ swapMe }: {swapMe: Tracked<Component>}) {
  <@swapMe />
}

component Child1(props) {
  <pre>{'I am child 1'}</pre>
}

component Child2(props) {
  <pre>{'I am child 2'}</pre>
}
`,
	},
	{
		title: 'Component Transport Pattern',
		code: `import { track } from 'ripple';

export default component App() {
  const tracked_basic = track(() => basic);
  const obj = {
    tracked_basic,
  };
  const ripple_object = track(obj);
  const Button = track(() => SomeButton);
  const AnotherButton = track(() => SomeButton);

  <@ripple_object.@tracked_basic />
  <Child {Button}>{'Child Button'}</Child>
  <AnotherChild Button={AnotherButton}>{'Another Child Button'}</AnotherChild>
}

component Child({ Button, children }) {
  <@Button>{children}</@Button>
}

component AnotherChild(props) {
  <props.@Button>{props.children}</props.@Button>
}

component SomeButton({ children }) {
  <button onClick={() => alert('Clicked')}>
		{children}
	</button>
}

component basic() {
  <div>{'Basic Component'}</div>
}
`,
	},
	{
		title: 'Untracking Reactivity',
		code: `import { effect, track, untrack } from 'ripple';

export default component App() {
  let count = track(10);
  let double = track(() => @count * 2);
  let quadruple = track(() => @double * 2);

  effect(() => {
    // This effect will never fire again, as we've untracked the only dependency it has
    console.log(untrack(() => @quadruple));
  })
}
`,
	},
	{
		title: 'Events',
		code: `import { effect, on, track } from 'ripple';

export default component App() {
  let message = track('');

  <div>
		<p>{'Try resizing the window!'}</p>
    <button onClick={() => @message = 'Clicked!'}>{'Click me'}</button>
    <input onInput={(e) => @message = e.target.value} />
    <p>{@message}</p>
  </div>

  effect(() => {
    // on component mount
    const removeListener = on(window, 'resize', () => {
      console.log('Window resized!');
    });

    // return the removeListener when the component unmounts
    return removeListener;
  });
}
`,
	},
	{
		title: 'DOM References',
		code: `import { track } from 'ripple';

export default component App() {
  let div = track();

  const divRef = (node) => {
    @div = node;
    console.log("mounted", node);

    return () => {
      @div = undefined;
      console.log("unmounted", node);
    };
  };

	<div {ref divRef}>"Hello world"</div>
}
`,
	},
	{
		title: 'createRefKey',
		code: `import { createRefKey, track } from 'ripple';

export default component App() {
  let value = track('');

  const props = {
    id: "example",
    @value,
    [createRefKey()]: (node) => {
      const removeListener = node.addEventListener('input', (e) => {
        @value = e.target.value;
        console.log(@value);
      });

      return () => {
        removeListener();
      }
    }
  };

  <input type="text" {...props} />
  <div>{@value}</div>
}
`,
	},
	{
		title: 'Context',
		code: `import { Context } from 'ripple';

const MyContext = new Context(null);

export default component Parent() {
	const value = MyContext.get();

	// Context is read in the Parent component, but hasn't yet
	// been set, so we fallback to the initial context value.
	// So the value is \`null\`
	console.log(value);

	// Context is set in the Parent component
	MyContext.set("Hello from context!");

	<Child />
}

component Child() {
	// Context is read in the Child component
	const value = MyContext.get();

	// value is "Hello from context!"
	console.log(value);
}
`,
	},
];
