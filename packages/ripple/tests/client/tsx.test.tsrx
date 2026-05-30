import { flushSync, track } from 'ripple';

describe('tsx expression', () => {
	it('renders an empty <></> element', () => {
		function App() {
			return <>
				<></>
			</>;
		}
		render(App);
		expect(container.textContent).toBe('');
	});

	it('renders an empty <></> fragment shorthand', () => {
		function App() {
			return <>
				<></>
			</>;
		}
		render(App);
		expect(container.textContent).toBe('');
	});

	it('renders an empty <></> assigned to a variable', () => {
		function App() {
			return <>
				const el = <></>;
				{el}
			</>;
		}
		render(App);
		expect(container.textContent).toBe('');
	});

	it('renders an empty <></> fragment assigned to a variable', () => {
		function App() {
			return <>
				const el = <></>;
				{el}
			</>;
		}
		render(App);
		expect(container.textContent).toBe('');
	});

	it('renders a basic fragment shorthand element', () => {
		function App() {
			return <>
				const el = <><div>"hello world"</div></>;
				{el}
			</>;
		}
		render(App);
		expect(container.textContent).toBe('hello world');
		expect(container.querySelector('div')).toBeTruthy();
	});

	it('applies scoped classes inside tsx blocks and fragment shorthand', () => {
		function App() {
			return <>
				<>
					<div class="card">
						<h2>{'tsx block'}</h2>
					</div>
				</>
				<>
					<div class="card">
						<h2>{'fragment shorthand'}</h2>
					</div>
				</>
				<style>
					.card {
						padding: 1rem;
					}

					h2 {
						color: red;
					}
				</style>
			</>;
		}

		render(App);

		const cards = Array.from(container.querySelectorAll('.card'));
		const headings = Array.from(container.querySelectorAll('h2'));

		expect(cards).toHaveLength(2);
		expect(headings).toHaveLength(2);

		cards.forEach((card) => {
			expect(
				Array.from(card.classList).filter((className) => className.startsWith('tsrx-')),
			).toHaveLength(1);
		});

		headings.forEach((heading) => {
			expect(
				Array.from(heading.classList).filter((className) => className.startsWith('tsrx-')),
			).toHaveLength(1);
		});
	});

	it('renders a tsx element assigned to a variable', () => {
		function App() {
			return <>
				const el = <><span class="test">"content"</span></>;
				{el}
			</>;
		}
		render(App);
		const span = container.querySelector('span.test');
		expect(span).toBeTruthy();
		expect(span.textContent).toBe('content');
	});

	it('renders a tsx element with multiple children', () => {
		function App() {
			return <>
				const el = <>
					<div>"first"</div>
					<div>"second"</div>
				</>;
				{el}
			</>;
		}
		render(App);
		const divs = container.querySelectorAll('div');
		expect(divs.length).toBe(2);
		expect(divs[0].textContent).toBe('first');
		expect(divs[1].textContent).toBe('second');
	});

	it('renders a tsx element with nested elements', () => {
		function App() {
			return <>
				const el = <>
					<div class="outer">
						<span class="inner">"nested"</span>
					</div>
				</>;
				{el}
			</>;
		}
		render(App);
		const outer = container.querySelector('div.outer');
		expect(outer).toBeTruthy();
		const inner = outer.querySelector('span.inner');
		expect(inner).toBeTruthy();
		expect(inner.textContent).toBe('nested');
	});

	it('renders a tsx element inline in a parent element', () => {
		function App() {
			return <>
				const el = <><span>"inline"</span></>;
				<div class="parent">{el}</div>
			</>;
		}
		render(App);
		const parent = container.querySelector('div.parent');
		expect(parent).toBeTruthy();
		expect(parent.querySelector('span')).toBeTruthy();
		expect(parent.textContent).toBe('inline');
	});

	it('renders a tsx element with reactive expressions', () => {
		function App() {
			return <>
				let &[count] = track(0);
				const el = <>
					<div>
						{'count: ' + count}
					</div>
				</>;
				{el}
				<button onClick={() => count++}>{'increment'}</button>
			</>;
		}
		render(App);
		expect(container.querySelector('div').textContent).toBe('count: 0');

		container.querySelector('button').click();
		flushSync();
		expect(container.querySelector('div').textContent).toBe('count: 1');
	});

	it('conditionally renders tsx elements', () => {
		function App() {
			return <>
				let &[show] = track(true);
				const el = <><div class="tsx-content">"visible"</div></>;
				if (show) {
					{el}
				}
				<button onClick={() => (show = !show)}>{'toggle'}</button>
			</>;
		}
		render(App);
		expect(container.querySelector('.tsx-content')).toBeTruthy();

		container.querySelector('button').click();
		flushSync();
		expect(container.querySelector('.tsx-content')).toBeFalsy();

		container.querySelector('button').click();
		flushSync();
		expect(container.querySelector('.tsx-content')).toBeTruthy();
	});

	it('renders tsx element passed as children prop', () => {
		function Child(&{ children }) {
			return <><div class="wrapper">{children}</div></>;
		}

		function App() {
			return <>
				const el = <><span>"from tsx"</span></>;
				<Child children={el} />
			</>;
		}
		render(App);
		const wrapper = container.querySelector('.wrapper');
		expect(wrapper).toBeTruthy();
		expect(wrapper.querySelector('span')).toBeTruthy();
		expect(wrapper.textContent).toBe('from tsx');
	});

	it('renders tsx element with text content only', () => {
		function App() {
			return <>
				const el = <>"just text"</>;
				{el}
			</>;
		}

		render(App);
		expect(container.textContent.trim()).toBe('just text');
	});

	it('renders tsx element with static attributes', () => {
		function App() {
			return <>
				const el = <>
					<div id="my-id" class="my-class" data-testid="test" aria-label="label">"content"</div>
				</>;
				{el}
			</>;
		}

		render(App);
		const div = container.querySelector('div');
		expect(div.id).toBe('my-id');
		expect(div.className).toBe('my-class');
		expect(div.getAttribute('data-testid')).toBe('test');
		expect(div.getAttribute('aria-label')).toBe('label');
	});

	it('renders tsx element with dynamic attribute values', () => {
		function App() {
			return <>
				let &[name] = track('initial');
				const el = <><div id={name} class={'cls-' + name}>"content"</div></>;
				{el}
				<button onClick={() => (name = 'updated')}>{'update'}</button>
			</>;
		}

		render(App);
		const div = container.querySelector('div');
		expect(div.id).toBe('initial');
		expect(div.className).toBe('cls-initial');

		container.querySelector('button').click();
		flushSync();
		expect(div.id).toBe('updated');
		expect(div.className).toBe('cls-updated');
	});

	it('renders tsx element with event handlers', () => {
		function App() {
			return <>
				let &[clicked] = track(false);
				const el = <><button onClick={() => (clicked = true)}>{'click me'}</button></>;
				{el}
				<div class="status">{clicked ? 'clicked' : 'not clicked'}</div>
			</>;
		}

		render(App);
		expect(container.querySelector('.status').textContent).toBe('not clicked');

		container.querySelector('button').click();
		flushSync();
		expect(container.querySelector('.status').textContent).toBe('clicked');
	});

	it('renders tsx element with boolean attributes', () => {
		function App() {
			return <>
				let &[isDisabled] = track(true);
				const el = <><button disabled={isDisabled}>{'btn'}</button></>;
				{el}
				<button class="toggle" onClick={() => (isDisabled = !isDisabled)}>{'toggle'}</button>
			</>;
		}

		render(App);
		expect(container.querySelector('button:not(.toggle)').disabled).toBe(true);

		container.querySelector('.toggle').click();
		flushSync();
		expect(container.querySelector('button:not(.toggle)').disabled).toBe(false);
	});

	it('renders tsx element with style attribute', () => {
		function App() {
			return <>
				let &[color] = track('red');
				const el = <><div style={'color: ' + color}>"styled"</div></>;
				{el}
				<button onClick={() => (color = 'blue')}>{'change color'}</button>
			</>;
		}

		render(App);
		expect(container.querySelector('div').style.color).toBe('red');

		container.querySelector('button').click();
		flushSync();
		expect(container.querySelector('div').style.color).toBe('blue');
	});

	it('renders tsx element with multiple dynamic attributes', () => {
		function App() {
			return <>
				let &[index] = track(0);
				const el = <>
					<div
						id={'item-' + index}
						class={'item pos-' + index}
						data-index={index}
						title={'Item ' + index}
					>
						{'Item ' + index}
					</div>
				</>;
				{el}
				<button onClick={() => index++}>{'next'}</button>
			</>;
		}

		render(App);
		const div = container.querySelector('div');
		expect(div.id).toBe('item-0');
		expect(div.className).toBe('item pos-0');
		expect(div.getAttribute('data-index')).toBe('0');
		expect(div.title).toBe('Item 0');

		container.querySelector('button').click();
		flushSync();
		expect(div.id).toBe('item-1');
		expect(div.className).toBe('item pos-1');
		expect(div.getAttribute('data-index')).toBe('1');
		expect(div.title).toBe('Item 1');
	});

	it('renders fragment shorthand passed directly as component prop', () => {
		function Wrapper(&{ content }) {
			return <><div class="wrapper">{content}</div></>;
		}

		function App() {
			return <><Wrapper content={<><span class="inner">"direct prop"</span></>} /></>;
		}

		render(App);
		const wrapper = container.querySelector('.wrapper');
		expect(wrapper).toBeTruthy();
		expect(wrapper.querySelector('.inner')).toBeTruthy();
		expect(wrapper.textContent).toBe('direct prop');
	});

	it('renders fragment shorthand passed directly as children prop', () => {
		function Card(&{ title, children }) {
			return <>
				<div class="card">
					<h2 class="card-title">{title}</h2>
					<div class="card-body">{children}</div>
				</div>
			</>;
		}

		function App() {
			return <>
				<Card
					title={<><span class="bold">"Title"</span></>}
					children={<><p>"Card content here"</p></>}
				/>
			</>;
		}

		render(App);
		const card = container.querySelector('.card');
		expect(card.querySelector('.card-title .bold').textContent).toBe('Title');
		expect(card.querySelector('.card-body p').textContent).toBe('Card content here');
	});

	it('renders tsx from function defined outside component', () => {
		function createBadge(label) {
			return <><span class="badge">{label}</span></>;
		}

		function App() {
			return <>
				const badge = createBadge('New');
				{badge}
			</>;
		}

		render(App);
		expect(container.querySelector('.badge')).toBeTruthy();
		expect(container.querySelector('.badge').textContent).toBe('New');
	});

	it('renders tsx from function with multiple elements', () => {
		function createListItem(item) {
			return <><li class="list-item">{item}</li></>;
		}

		function App() {
			return <>
				const items = ['Apple', 'Banana', 'Cherry'];
				<ul>
					for (const item of items) {
						{createListItem(item)}
					}
				</ul>
			</>;
		}

		render(App);
		const listItems = container.querySelectorAll('.list-item');
		expect(listItems.length).toBe(3);
		expect(listItems[0].textContent).toBe('Apple');
		expect(listItems[1].textContent).toBe('Banana');
		expect(listItems[2].textContent).toBe('Cherry');
	});

	it('renders tsx from factory function passed to component', () => {
		function List(&{ renderItem, items }) {
			return <>
				<ul class="list">
					for (const item of items) {
						{renderItem(item)}
					}
				</ul>
			</>;
		}

		function itemRenderer(item) {
			return <>
				<li>
					<span class="item-content">{item}</span>
				</li>
			</>;
		}

		function App() {
			return <><List items={['One', 'Two', 'Three']} renderItem={itemRenderer} /></>;
		}

		render(App);
		const items = container.querySelectorAll('.item-content');
		expect(items.length).toBe(3);
		expect(items[0].textContent).toBe('One');
		expect(items[1].textContent).toBe('Two');
		expect(items[2].textContent).toBe('Three');
	});

	it('renders tsx from function with reactive state', () => {
		function createCounter(label, getCount) {
			return <>
				<div class="counter-display">
					<span class="label">{label}</span>
					<span class="count">
						{getCount()}
					</span>
				</div>
			</>;
		}

		function App() {
			return <>
				let &[count] = track(0);
				const counterElement = createCounter('Count:', () => count);
				{counterElement}
				<button onClick={() => count++}>{'increment'}</button>
			</>;
		}

		render(App);
		expect(container.querySelector('.label').textContent).toBe('Count:');
		expect(container.querySelector('.count').textContent).toBe('0');

		container.querySelector('button').click();
		flushSync();
		expect(container.querySelector('.count').textContent).toBe('1');
	});

	it('renders nested tsx from multiple functions', () => {
		function createIcon(name) {
			return <><i class={'icon icon-' + name} /></>;
		}

		function createButton(icon, label) {
			return <>
				<button class="icon-button">
					{createIcon(icon)}
					<span class="btn-label">{label}</span>
				</button>
			</>;
		}

		function App() {
			return <>
				const btn = createButton('save', 'Save');
				{btn}
			</>;
		}

		render(App);
		const button = container.querySelector('.icon-button');
		expect(button).toBeTruthy();
		expect(button.querySelector('.icon-save')).toBeTruthy();
		expect(button.querySelector('.btn-label').textContent).toBe('Save');
	});

	it('renders deeply nested tsx and tsrx expression values', () => {
		function HelperItem({ item }) {
			return <><div class="helper-item">{item}</div></>;
		}

		function MakeFragment({ label }) {
			return <>
				<span class="label">{label}</span>
				const test = <>{[1, 2, 3, 4].map((item) => <><HelperItem {item} /></>)}</>;
				{test}
			</>;
		}

		function App() {
			return <>
				{<>{[1, 2, 3].map((item) => <div class="app-item">{item}</div>)}</>}
				<MakeFragment label="from helper" />
			</>;
		}

		render(App);

		expect(
			Array.from(container.querySelectorAll('.app-item')).map((node) => node.textContent),
		).toEqual([
			'1',
			'2',
			'3',
		]);
		expect(container.querySelector('.label').textContent).toBe('from helper');
		expect(
			Array.from(container.querySelectorAll('.helper-item')).map((node) => node.textContent),
		).toEqual(['1', '2', '3', '4']);
	});

	it('renders tsrx nested directly inside a top-level tsx expression value', () => {
		function App() {
			return <>
				const content = <>
					<section class="outer">
						{<><div class="inner">{'from tsrx'}</div></>}
					</section>
				</>;
				{content}
			</>;
		}

		render(App);

		const outer = container.querySelector('.outer');
		expect(outer).toBeTruthy();
		expect(outer.querySelector('.inner').textContent).toBe('from tsrx');
	});

	it('renders nested elements from tsrx inside a top-level tsx value', () => {
		function App() {
			return <>
				const content = <>
					<div class="wrapper">
						{<>
							<section class="native">
								<span class="nested-tsrx">{'inside nested tsrx'}</span>
							</section>
						</>}
					</div>
				</>;
				{content}
			</>;
		}

		render(App);

		const native = container.querySelector('.native');
		expect(native).toBeTruthy();
		expect(native.querySelector('.nested-tsrx').textContent).toBe('inside nested tsrx');
	});

	it('renders tsx declared before a top-level tsx value', () => {
		function App() {
			return <>
				const nested = <><span class="nested-tsx">{'inside nested tsx'}</span></>;
				const content = <><div class="native">{nested}</div></>;
				{content}
			</>;
		}

		render(App);

		const native = container.querySelector('.native');
		expect(native).toBeTruthy();
		expect(native.querySelector('.nested-tsx').textContent).toBe('inside nested tsx');
	});

	it('renders tsx as prop with fallback in component', () => {
		function Alert(&{ icon, message }) {
			return <>
				<div class="alert">
					{icon}
					<span class="message">{message}</span>
				</div>
			</>;
		}

		function App() {
			return <>
				<Alert message="No icon" />
				<Alert icon={<><span class="custom-icon">"✓"</span></>} message="Custom icon" />
			</>;
		}

		render(App);
		const alerts = container.querySelectorAll('.alert');
		expect(alerts[0].querySelector('.message').textContent).toBe('No icon');
		expect(alerts[1].querySelector('.custom-icon')).toBeTruthy();
		expect(alerts[1].querySelector('.message').textContent).toBe('Custom icon');
	});

	it('renders tsx stored in array via function', () => {
		function createItem(className, content) {
			return <><div class={className}>{content}</div></>;
		}

		function App() {
			return <>
				const items = [
					{ className: 'item-a', content: 'A' },
					{ className: 'item-b', content: 'B' },
					{ className: 'item-c', content: 'C' },
				];
				<div class="container">
					for (const item of items) {
						{createItem(item.className, item.content)}
					}
				</div>
			</>;
		}

		render(App);
		const container_el = container.querySelector('.container');
		expect(container_el.querySelector('.item-a').textContent).toBe('A');
		expect(container_el.querySelector('.item-b').textContent).toBe('B');
		expect(container_el.querySelector('.item-c').textContent).toBe('C');
	});

	it('renders tsx conditionally from function', () => {
		function createContent(type) {
			if (type === 'success') {
				return <><div class="success">"Success!"</div></>;
			} else if (type === 'error') {
				return <><div class="error">"Error!"</div></>;
			}
			return <><div class="default">"Default"</div></>;
		}

		function App() {
			return <>
				let &[status] = track('default');
				{createContent(status)}
				<button class="set-success" onClick={() => (status = 'success')}>{'Success'}</button>
				<button class="set-error" onClick={() => (status = 'error')}>{'Error'}</button>
			</>;
		}

		render(App);
		expect(container.querySelector('.default')).toBeTruthy();

		container.querySelector('.set-success').click();
		flushSync();
		expect(container.querySelector('.success')).toBeTruthy();
		expect(container.querySelector('.default')).toBeFalsy();

		container.querySelector('.set-error').click();
		flushSync();
		expect(container.querySelector('.error')).toBeTruthy();
		expect(container.querySelector('.success')).toBeFalsy();
	});
});

describe('tsrx expression', () => {
	it('renders native double-quoted text in an assigned fragment', () => {
		function App() {
			return <>
				const el = <><div>"Hello world"</div></>;
				{el}
			</>;
		}

		render(App);

		const div = container.querySelector('div');
		expect(div).toBeTruthy();
		expect(div.textContent).toBe('Hello world');
	});

	it('runs setup statements before native template output', () => {
		function App() {
			return <>
				const el = <>
					const label = 'from setup';
					<div>{label}</div>
				</>;
				{el}
			</>;
		}

		render(App);

		expect(container.querySelector('div').textContent).toBe('from setup');
	});

	it('updates reactive expressions inside native fragments', () => {
		function App() {
			return <>
				let &[count] = track(0);
				const el = <><div>{'count: ' + count}</div></>;
				{el}
				<button onClick={() => count++}>{'increment'}</button>
			</>;
		}

		render(App);

		expect(container.querySelector('div').textContent).toBe('count: 0');
		container.querySelector('button').click();
		flushSync();
		expect(container.querySelector('div').textContent).toBe('count: 1');
	});

	it('renders native control flow inside an assigned fragment', () => {
		function App() {
			return <>
				const el = <>
					if (true) {
						<span>"visible"</span>
					}
				</>;
				{el}
			</>;
		}

		render(App);

		expect(container.querySelector('span').textContent).toBe('visible');
	});

	it('renders fragments returned from component functions outside components', () => {
		function MakeFragment({ label }) {
			return <><span>{label}</span></>;
		}

		function App() {
			return <><MakeFragment label="from helper" /></>;
		}

		render(App);

		expect(container.querySelector('span').textContent).toBe('from helper');
	});
});
