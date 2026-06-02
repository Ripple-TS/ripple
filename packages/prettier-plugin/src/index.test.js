import { describe, it, expect } from 'vitest';
import prettier from 'prettier';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { languages } from './index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

expect.extend({
	toBeWithNewline(received, expected) {
		const expectedWithNewline = expected.endsWith('\n') ? expected : expected + '\n';
		const pass = received === expectedWithNewline;

		return {
			pass,
			message: () => {
				const { matcherHint, EXPECTED_COLOR, RECEIVED_COLOR } = this.utils;

				/**
				 * @param {string} str
				 * @param {(str: string) => string} colorFn
				 */
				const formatWithColor = (str, colorFn) => {
					return colorFn(str);
				};

				// Just apply color without modifying the string
				return (
					matcherHint('toBeWithNewline') +
					'\n\nExpected:\n' +
					formatWithColor(expectedWithNewline, EXPECTED_COLOR) +
					'\nReceived:\n' +
					formatWithColor(received, RECEIVED_COLOR)
				);
			},
		};
	},
});

describe('prettier-plugin', () => {
	it('should format a simple function', async () => {
		const input = `export function Test(){let count=0;<div>{"Hello"}</div>}`;
		const expected = `export function Test() {
  let count = 0;
  <div>{'Hello'}</div>
}`;
		const result = await format(input, { singleQuote: true });
		expect(result).toBeWithNewline(expected);
	});

	it('should format tsrx expression fragments', async () => {
		const input = `function App(){const content=<>const label="Hi";<div>"Hello" {label}</div>{content}</>;}`;
		const expected = `function App() {
  const content = <>
    const label = 'Hi';
    <div>"Hello"{label}</div>
    {content}
  </>;
}`;
		const result = await format(input, { singleQuote: true });
		expect(result).toBeWithNewline(expected);
	});

	it('keeps ordinary single-expression blocks expanded', async () => {
		const input = `function Test(){ {value} }`;
		const expected = `function Test() {
  {
    value;
  }
}`;

		const result = await format(input);
		expect(result).toBeWithNewline(expected);
	});

	it('should keep sibling children in tsrx expression fragments on separate lines', async () => {
		const input = `function Test(p1,p2){return <><div>"Hello"</div><div>{p1}</div><div>{p2}</div></>}`;
		const expected = `function Test(p1, p2) {
  return <>
    <div>"Hello"</div>
    <div>{p1}</div>
    <div>{p2}</div>
  </>;
}`;
		const result = await format(input);
		expect(result).toBeWithNewline(expected);
	});

	it('keeps fitting tsrx arrow returns inline in declarations and attributes', async () => {
		const input = `function Test(props){const func=(item)=><><Item {item}/></>;<List renderItem={(item)=><><Item {item}/></>} />}`;
		const expected = `function Test(props) {
  const func = (item) => <><Item {item} /></>;
  <List renderItem={(item) => <><Item {item} /></>} />
}`;

		const result = await format(input, { printWidth: 60 });
		expect(result).toBeWithNewline(expected);
	});

	it('breaks non-fitting tsrx arrow returns after the arrow in declarations and attributes - printWidth: 60', async () => {
		const input = `function Test(props) {
  const func = (item) => <><ItemView {item} onSelect={props.onSelect} /></>;
  <List
    items={props.items}
    renderItem={(item) => <><ItemView {item} onSelect={props.onSelect} /></>}
  />
}`;
		const expected = `function Test(props) {
  const func = (item) =>
    <><ItemView {item} onSelect={props.onSelect} /></>;
  <List
    items={props.items}
    renderItem={(item) =>
      <><ItemView {item} onSelect={props.onSelect} /></>
    }
  />
}`;
		const result = await format(input, { singleQuote: true, printWidth: 60 });
		expect(result).toBeWithNewline(expected);
	});

	it('breaks non-fitting tsrx arrow returns after the arrow in declarations and attributes - printWidth: 80', async () => {
		const input = `function Test(props) {
  const func = (item) => <><ItemView {item} onSelect={props.onSelect} /></>;
  <List
    items={props.items}
    renderItem={(item) => <><ItemView {item} onSelect={props.onSelect} /></>}
  />
}`;
		const expected = `function Test(props) {
  const func = (item) => <><ItemView {item} onSelect={props.onSelect} /></>;
  <List
    items={props.items}
    renderItem={(item) => <><ItemView {item} onSelect={props.onSelect} /></>}
  />
}`;
		const result = await format(input, { singleQuote: true, printWidth: 80 });
		expect(result).toBeWithNewline(expected);
	});

	it('keeps fitting single-child fragments inline and expands non-fitting single-child fragments', async () => {
		const input = `function Test(){const short=<><span>"Ready"</span></>;const long=<><ReallyLongComponentName first={alpha} second={beta} third={gamma}/></>;}`;
		const expected = `function Test() {
  const short = <><span>"Ready"</span></>;
  const long = <>
    <ReallyLongComponentName
      first={alpha}
      second={beta}
      third={gamma}
    />
  </>;
}`;

		const result = await format(input, { printWidth: 60 });
		expect(result).toBeWithNewline(expected);
	});

	it('expands multi-child fragments while keeping fitting openers on the first line', async () => {
		const input = `function Test(){const short=<><div>"A"</div><div>"B"</div></>;const thisNameIsRidiculouslyLongEnoughToMissThePrintWidth=<><div>"A"</div><div>"B"</div></>;}`;
		const expected = `function Test() {
  const short = <>
    <div>"A"</div>
    <div>"B"</div>
  </>;
  const thisNameIsRidiculouslyLongEnoughToMissThePrintWidth =
    <>
      <div>"A"</div>
      <div>"B"</div>
    </>;
}`;

		const result = await format(input, { printWidth: 60 });
		expect(result).toBeWithNewline(expected);
	});

	it('should preserve comments before expressions after nested tsx and tsrx blocks', async () => {
		const expected = `function App() {
  const content = <>
    <span class="nested-tsx">{'inside nested tsx'}</span>
    <div class="native">{nested}</div>
    // const content =
    //   <div>{hey()}</div>
    // ;
    {content}
  </>;
  return content;
}`;
		const result = await format(expected, { singleQuote: true });
		expect(result).toBeWithNewline(expected);
	});

	it('should format whitespace correctly', async () => {
		const input = `export function Test(){
  return <>
        let count=0
        // comment
        <div>{"Hello"}</div>
        <div>
          let two=2
          {"Hello"}
        </div>
  </>;
    }`;
		const expected = `export function Test() {
  return <>
    let count = 0;
    // comment
    <div>{'Hello'}</div>
    <div>
      let two = 2;
      {'Hello'}
    </div>
  </>;
}`;
		const result = await format(input, { singleQuote: true });
		expect(result).toBeWithNewline(expected);
	});

	it('should format whitespace correctly #2', async () => {
		const input = `export function Test(){
    return <>
        let count=0
          const x = () => {
            console.log("test");
            if (x) {
              console.log('test');
              return null;
            }
            if (y) {
              return null;
            }
            return x;
          }
        <div>{"Hello"}</div>
        <div>
          let two=2
          {"Hello"}
        </div>
    </>;
    }`;
		const expected = `export function Test() {
  return <>
    let count = 0;
    const x = () => {
      console.log('test');
      if (x) {
        console.log('test');
        return null;
      }
      if (y) {
        return null;
      }
      return x;
    };
    <div>{'Hello'}</div>
    <div>
      let two = 2;
      {'Hello'}
    </div>
  </>;
}`;
		const result = await format(input, { singleQuote: true });
		expect(result).toBeWithNewline(expected);
	});

	it('registers .tsrx as a supported file extension', () => {
		const ripple_language = languages?.[0];

		if (!ripple_language) {
			throw new Error('Missing Ripple language metadata');
		}

		expect(ripple_language.extensions).toContain('.tsrx');
	});

	/**
	 * @param {string} code
	 * @param {import('prettier').Options} [options]
	 */
	const format = async (code, options = {}) => {
		return await prettier.format(code, {
			parser: 'ripple',
			plugins: [join(__dirname, 'index.js')],
			...options,
		});
	};

	it('formats functions that return native elements', async () => {
		const input = `export function App(){return <div id="app">{"Hello"}</div>}`;
		const expected = `export function App() {
  return <div id="app">{"Hello"}</div>;
}`;

		const result = await format(input);
		expect(result).toBeWithNewline(expected);
	});

	it('formats native fragments with statements inside returned TSRX', async () => {
		const input = `function App(){return <>const items=[1,2,3];for(const item of items; index i; key item){<div>{i}{item}</div>}</>}`;
		const expected = `function App() {
  return <>
    const items = [1, 2, 3];
    for (const item of items; index i; key item) {
      <div>
        {i}
        {item}
      </div>
    }
  </>;
}`;

		const result = await format(input);
		expect(result).toBeWithNewline(expected);
	});

	it('preserves fragment shorthand for simple returned TSRX expressions', async () => {
		const input = `const App=()=> <><span>{"Ready"}</span></>;`;
		const expected = `const App = () => <><span>{"Ready"}</span></>;`;

		const result = await format(input);
		expect(result).toBeWithNewline(expected);
	});

	it('keeps native fragments expression based', async () => {
		const input = `function App(){return <><div>"Hello world"</div>{value}</>}`;
		const expected = `function App() {
  return <>
    <div>"Hello world"</div>
    {value}
  </>;
}`;

		const result = await format(input);
		expect(result).toBeWithNewline(expected);
	});

	it('formats style tags inside returned TSRX', async () => {
		const input = `export default function App(){return <><style>div{color:red}</style></>}`;
		const expected = `export default function App() {
  return <>
    <style>
      div {
        color: red;
      }
    </style>
  </>;
}`;

		const result = await format(input);
		expect(result).toBeWithNewline(expected);
	});

	it('formats setup statements before the TSRX return', async () => {
		const input = `function Counter(){let count=track(0);const increment=()=>count++;return <button onClick={increment}>{count}</button>}`;
		const expected = `function Counter() {
  let count = track(0);
  const increment = () => count++;
  return <button onClick={increment}>{count}</button>;
}`;

		const result = await format(input);
		expect(result).toBeWithNewline(expected);
	});

	it('keeps single-line text and expression children inline when they fit', async () => {
		const input = `export function App() {
  let [count] = track(0);
  return <div>
    <p>"Count: "{count}</p>
    <p>"Count: "{count}</p>
    <button onClick={() => count++}>"Increment"</button>
  </div>;
}`;
		const expected = `export function App() {
  let [count] = track(0);
  return <div>
    <p>"Count: "{count}</p>
    <p>"Count: "{count}</p>
    <button onClick={() => count++}>"Increment"</button>
  </div>;
}`;

		const result = await format(input);
		expect(result).toBeWithNewline(expected);
	});

	it('preserves multiline text and expression children', async () => {
		const input = `export function App() {
  let [count] = track(0);
  return <div>
    <p>
      "Count: "
      {count}
    </p>
  </div>;
}`;
		const expected = `export function App() {
  let [count] = track(0);
  return <div>
    <p>
      "Count: "
      {count}
    </p>
  </div>;
}`;

		const result = await format(input);
		expect(result).toBeWithNewline(expected);
	});

	it('formats async component functions that await before returning TSRX', async () => {
		const input = `export async function App(){const data=await fetchData();return <pre>{data}</pre>}`;
		const expected = `export async function App() {
  const data = await fetchData();
  return <pre>{data}</pre>;
}`;

		const result = await format(input);
		expect(result).toBeWithNewline(expected);
	});

	it('formats object methods that return TSRX', async () => {
		const input = `const UI={Button({children}:{children:any}){return <button>{children}</button>}};`;
		const expected = `const UI = {
  Button({ children }: { children: any }) {
    return <button>{children}</button>;
  },
};`;

		const result = await format(input);
		expect(result).toBeWithNewline(expected);
	});

	it('formats generic function components and generic tags', async () => {
		const input = `function Box<T>({value}:{value:T}){return <div>{value}</div>}function App(){return <Box<string> value={"hello"}/>}`;
		const expected = `function Box<T>({ value }: { value: T }) {
  return <div>{value}</div>;
}
function App() {
  return <Box<string> value="hello" />;
}`;

		const result = await format(input);
		expect(result).toBeWithNewline(expected);
	});

	it('formats raw HTML props inside native elements', async () => {
		const input = `function App(){return <article innerHTML={source}/>}`;
		const expected = `function App() {
  return <article innerHTML={source} />;
}`;

		const result = await format(input);
		expect(result).toBeWithNewline(expected);
	});

	it('keeps TypeScript assertion expressions parenthesized before non-null assertions', async () => {
		const input = `function App(){return <div>{(child("value") as any)!}{(child("ok") satisfies any)!}</div>}`;
		const expected = `function App() {
  return <div>
    {(child("value") as any)!}
    {(child("ok") satisfies any)!}
  </div>;
}`;

		const result = await format(input);
		expect(result).toBeWithNewline(expected);
	});

	it('formats construct signatures inside chained type assertions', async () => {
		const input = `const Constructed = function Constructed(label: string) {
  return child(label);
} as unknown as {
  new (label: string): ReturnType<typeof child>;
};`;
		const expected = `const Constructed = function Constructed(label: string) {
  return child(label);
} as unknown as {
  new (label: string): ReturnType<typeof child>;
};`;

		const result = await format(input);
		expect(result).toBeWithNewline(expected);
	});

	it('formats returned TSRX fragments', async () => {
		const result = await format('function App() { return <> <div /> </>; }');
		expect(result).toBeWithNewline(`function App() {
  return <><div /></>;
}`);
	});
});
