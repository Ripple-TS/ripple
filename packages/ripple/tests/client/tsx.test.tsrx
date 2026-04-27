import { flushSync, track } from 'ripple';

describe('tsx expression', () => {
	it('renders an empty <tsx></tsx> element', () => {
		component App() {
			<tsx></tsx>
		}
		render(App);
		expect(container.textContent).toBe('');
	});

	it('renders an empty <></> fragment shorthand', () => {
		component App() {
			<></>
		}
		render(App);
		expect(container.textContent).toBe('');
	});

	it('renders an empty <tsx></tsx> assigned to a variable', () => {
		component App() {
			const el = <tsx></tsx>;
			{el}
		}
		render(App);
		expect(container.textContent).toBe('');
	});

	it('renders an empty <></> fragment assigned to a variable', () => {
		component App() {
			const el = <></>;
			{el}
		}
		render(App);
		expect(container.textContent).toBe('');
	});

	it('renders a basic fragment shorthand element', () => {
		component App() {
			const el = <tsx><div>hello world</div></tsx>;
			{el}
		}
		render(App);
		expect(container.textContent).toBe('hello world');
		expect(container.querySelector('div')).toBeTruthy();
	});

	it('applies scoped classes inside tsx blocks and fragment shorthand', () => {
		component App() {
			<tsx>
				<div class="card">
					<h2>
						{'tsx block'}
					</h2>
				</div>
			</tsx>

			<>
				<div class="card">
					<h2>
						{'fragment shorthand'}
					</h2>
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
		component App() {
			const el = <tsx><span class="test">content</span></tsx>;
			{el}
		}
		render(App);
		const span = container.querySelector('span.test');
		expect(span).toBeTruthy();
		expect(span.textContent).toBe('content');
	});

	it('renders a tsx element with multiple children', () => {
		component App() {
			const el = <tsx><div>first</div><div>second</div></tsx>;
			{el}
		}
		render(App);
		const divs = container.querySelectorAll('div');
		expect(divs.length).toBe(2);
		expect(divs[0].textContent).toBe('first');
		expect(divs[1].textContent).toBe('second');
	});

	it('renders a tsx element with nested elements', () => {
		component App() {
			const el = <tsx>
				<div class="outer">
					<span class="inner">nested</span>
				</div>
			</tsx>;
			{el}
		}
		render(App);
		const outer = container.querySelector('div.outer');
		expect(outer).toBeTruthy();
		const inner = outer.querySelector('span.inner');
		expect(inner).toBeTruthy();
		expect(inner.textContent).toBe('nested');
	});

	it('renders a tsx element inline in a parent element', () => {
		component App() {
			const el = <tsx><span>inline</span></tsx>;
			<div class="parent">{el}</div>
		}
		render(App);
		const parent = container.querySelector('div.parent');
		expect(parent).toBeTruthy();
		expect(parent.querySelector('span')).toBeTruthy();
		expect(parent.textContent).toBe('inline');
	});

	it('renders a tsx element with reactive expressions', () => {
		component App() {
			let &[count] = track(0);
			const el = <tsx>
				<div>
					{'count: ' + count}
				</div>
			</tsx>;
			{el}
			<button onClick={() => count++}>{'increment'}</button>
		}
		render(App);
		expect(container.querySelector('div').textContent).toBe('count: 0');

		container.querySelector('button').click();
		flushSync();
		expect(container.querySelector('div').textContent).toBe('count: 1');
	});

	it('conditionally renders tsx elements', () => {
		component App() {
			let &[show] = track(true);
			const el = <tsx><div class="tsx-content">visible</div></tsx>;

			if (show) {
				{el}
			}
			<button onClick={() => (show = !show)}>{'toggle'}</button>
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
		component Child(&{ children }: { children: any }) {
			<div class="wrapper">{children}</div>
		}

		component App() {
			const el = <tsx><span>from tsx</span></tsx>;
			<Child children={el} />
		}
		render(App);
		const wrapper = container.querySelector('.wrapper');
		expect(wrapper).toBeTruthy();
		expect(wrapper.querySelector('span')).toBeTruthy();
		expect(wrapper.textContent).toBe('from tsx');
	});

	it('renders tsx element with text content only', () => {
		component App() {
			const el = <tsx>just text</tsx>;
			{el}
		}
		render(App);
		expect(container.textContent).toBe('just text');
	});

	it('renders tsx element with static attributes', () => {
		component App() {
			const el = <tsx>
				<div id="my-id" class="my-class" data-testid="test" aria-label="label">content</div>
			</tsx>;
			{el}
		}
		render(App);
		const div = container.querySelector('div');
		expect(div.id).toBe('my-id');
		expect(div.className).toBe('my-class');
		expect(div.getAttribute('data-testid')).toBe('test');
		expect(div.getAttribute('aria-label')).toBe('label');
	});

	it('renders tsx element with dynamic attribute values', () => {
		component App() {
			let &[name] = track('initial');
			const el = <tsx><div id={name} class={'cls-' + name}>content</div></tsx>;
			{el}
			<button onClick={() => (name = 'updated')}>{'update'}</button>
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
		component App() {
			let &[clicked] = track(false);
			const el = <tsx>
				<button onClick={() => (clicked = true)}>
					{'click me'}
				</button>
			</tsx>;
			{el}
			<div class="status">{clicked ? 'clicked' : 'not clicked'}</div>
		}
		render(App);
		expect(container.querySelector('.status').textContent).toBe('not clicked');

		container.querySelector('button').click();
		flushSync();
		expect(container.querySelector('.status').textContent).toBe('clicked');
	});

	it('renders tsx element with boolean attributes', () => {
		component App() {
			let &[isDisabled] = track(true);
			const el = <tsx>
				<button disabled={isDisabled}>
					{'btn'}
				</button>
			</tsx>;
			{el}
			<button class="toggle" onClick={() => (isDisabled = !isDisabled)}>{'toggle'}</button>
		}
		render(App);
		expect(container.querySelector('button:not(.toggle)').disabled).toBe(true);

		container.querySelector('.toggle').click();
		flushSync();
		expect(container.querySelector('button:not(.toggle)').disabled).toBe(false);
	});

	it('renders tsx element with style attribute', () => {
		component App() {
			let &[color] = track('red');
			const el = <tsx><div style={'color: ' + color}>styled</div></tsx>;
			{el}
			<button onClick={() => (color = 'blue')}>{'change color'}</button>
		}
		render(App);
		expect(container.querySelector('div').style.color).toBe('red');

		container.querySelector('button').click();
		flushSync();
		expect(container.querySelector('div').style.color).toBe('blue');
	});

	it('renders tsx element with multiple dynamic attributes', () => {
		component App() {
			let &[index] = track(0);
			const el = <tsx>
				<div id={'item-' + index} class={'item pos-' + index} data-index={index} title={'Item ' +
					index}>
					{'Item ' + index}
				</div>
			</tsx>;
			{el}
			<button onClick={() => index++}>{'next'}</button>
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
		component Wrapper(&{ content }: { content: any }) {
			<div class="wrapper">{content}</div>
		}

		component App() {
			<Wrapper content={<tsx><span class="inner">direct prop</span></tsx>} />
		}
		render(App);
		const wrapper = container.querySelector('.wrapper');
		expect(wrapper).toBeTruthy();
		expect(wrapper.querySelector('.inner')).toBeTruthy();
		expect(wrapper.textContent).toBe('direct prop');
	});

	it('renders fragment shorthand passed directly as children prop', () => {
		component Card(&{ title, children }: { title: any; children: any }) {
			<div class="card">
				<h2 class="card-title">{title}</h2>
				<div class="card-body">{children}</div>
			</div>
		}

		component App() {
			<Card
				title={<tsx><span class="bold">Title</span></tsx>}
				children={<tsx><p>Card content here</p></tsx>}
			/>
		}
		render(App);
		const card = container.querySelector('.card');
		expect(card.querySelector('.card-title .bold').textContent).toBe('Title');
		expect(card.querySelector('.card-body p').textContent).toBe('Card content here');
	});

	it('renders tsx from function defined outside component', () => {
		function createBadge(label: string) {
			return <tsx>
				<span class="badge">
					{label}
				</span>
			</tsx>;
		}

		component App() {
			const badge = createBadge('New');
			{badge}
		}
		render(App);
		expect(container.querySelector('.badge')).toBeTruthy();
		expect(container.querySelector('.badge').textContent).toBe('New');
	});

	it('renders tsx from function with multiple elements', () => {
		function createListItem(item: string) {
			return <tsx>
				<li class="list-item">
					{item}
				</li>
			</tsx>;
		}

		component App() {
			const items = ['Apple', 'Banana', 'Cherry'];
			<ul>
				for (const item of items) {
					{createListItem(item)}
				}
			</ul>
		}
		render(App);
		const listItems = container.querySelectorAll('.list-item');
		expect(listItems.length).toBe(3);
		expect(listItems[0].textContent).toBe('Apple');
		expect(listItems[1].textContent).toBe('Banana');
		expect(listItems[2].textContent).toBe('Cherry');
	});

	it('renders tsx from factory function passed to component', () => {
		component List(&{ renderItem, items }: { renderItem: (item: string) => any; items: string[] }) {
			<ul class="list">
				for (const item of items) {
					{renderItem(item)}
				}
			</ul>
		}

		function itemRenderer(item: string) {
			return <tsx>
				<li>
					<span class="item-content">
						{item}
					</span>
				</li>
			</tsx>;
		}

		component App() {
			<List items={['One', 'Two', 'Three']} renderItem={itemRenderer} />
		}
		render(App);
		const items = container.querySelectorAll('.item-content');
		expect(items.length).toBe(3);
		expect(items[0].textContent).toBe('One');
		expect(items[1].textContent).toBe('Two');
		expect(items[2].textContent).toBe('Three');
	});

	it('renders tsx from function with reactive state', () => {
		function createCounter(label: string, getCount: () => number) {
			return <tsx>
				<div class="counter-display">
					<span class="label">
						{label}
					</span>
					<span class="count">
						{getCount()}
					</span>
				</div>
			</tsx>;
		}

		component App() {
			let &[count] = track(0);
			const counterElement = createCounter('Count:', () => count);
			{counterElement}
			<button onClick={() => count++}>{'increment'}</button>
		}
		render(App);
		expect(container.querySelector('.label').textContent).toBe('Count:');
		expect(container.querySelector('.count').textContent).toBe('0');

		container.querySelector('button').click();
		flushSync();
		expect(container.querySelector('.count').textContent).toBe('1');
	});

	it('renders nested tsx from multiple functions', () => {
		function createIcon(name: string) {
			return <tsx><i class={'icon icon-' + name}></i></tsx>;
		}

		function createButton(icon: string, label: string) {
			return <tsx>
				<button class="icon-button">
					{createIcon(icon)}
					<span class="btn-label">
						{label}
					</span>
				</button>
			</tsx>;
		}

		component App() {
			const btn = createButton('save', 'Save');
			{btn}
		}
		render(App);
		const button = container.querySelector('.icon-button');
		expect(button).toBeTruthy();
		expect(button.querySelector('.icon-save')).toBeTruthy();
		expect(button.querySelector('.btn-label').textContent).toBe('Save');
	});

	it('renders tsx as prop with fallback in component', () => {
		component Alert(&{ icon, message }: { icon?: any; message: string }) {
			<div class="alert">
				{icon}
				<span class="message">{message}</span>
			</div>
		}

		component App() {
			<Alert message="No icon" />
			<Alert icon={<tsx><span class="custom-icon">✓</span></tsx>} message="Custom icon" />
		}
		render(App);
		const alerts = container.querySelectorAll('.alert');
		expect(alerts[0].querySelector('.message').textContent).toBe('No icon');
		expect(alerts[1].querySelector('.custom-icon')).toBeTruthy();
		expect(alerts[1].querySelector('.message').textContent).toBe('Custom icon');
	});

	it('renders tsx stored in array via function', () => {
		function createItem(className: string, content: string) {
			return <tsx>
				<div class={className}>
					{content}
				</div>
			</tsx>;
		}

		component App() {
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
		}
		render(App);
		const container_el = container.querySelector('.container');
		expect(container_el.querySelector('.item-a').textContent).toBe('A');
		expect(container_el.querySelector('.item-b').textContent).toBe('B');
		expect(container_el.querySelector('.item-c').textContent).toBe('C');
	});

	it('renders tsx conditionally from function', () => {
		function createContent(type: string) {
			if (type === 'success') {
				return <tsx><div class="success">Success!</div></tsx>;
			} else if (type === 'error') {
				return <tsx><div class="error">Error!</div></tsx>;
			}
			return <tsx><div class="default">Default</div></tsx>;
		}

		component App() {
			let &[status] = track('default');
			{createContent(status)}
			<button class="set-success" onClick={() => (status = 'success')}>{'Success'}</button>
			<button class="set-error" onClick={() => (status = 'error')}>{'Error'}</button>
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
