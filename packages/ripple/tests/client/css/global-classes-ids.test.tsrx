import { compile } from '@tsrx/ripple';

describe('CSS :global with classes and IDs', () => {
	it('handles :global with single class', () => {
		const source = `
export component Test() {
	<div class="foo">{'content'}</div>

	<style>
		:global(.foo) {
			color: red;
		}
	</style>
}`;
		const { css } = compile(source, 'test.tsrx');

		expect(css).toContain('.foo {');
		expect(css).not.toMatch(/\.foo\.tsrx-[a-z0-9]+/);
	});

	it('handles :global with chained classes', () => {
		const source = `
export component Test() {
	<div class="foo bar">{'content'}</div>

	<style>
		:global(.foo.bar) {
			color: red;
		}

		:global(.foo).bar {
			color: blue;
		}

		.foo:global(.bar) {
			color: green;
		}
	</style>
}`;
		const { css } = compile(source, 'test.tsrx');

		expect(css).toContain('.foo.bar {');
		expect(css).toMatch(/\.foo\.bar\.tsrx-[a-z0-9]+ {/);
		expect(css).toMatch(/\.foo\.tsrx-[a-z0-9]+\.bar {/);
	});

	it('handles local class inside :global selector', () => {
		const source = `
export component Test() {
	<div class="outer">
		<span class="inner">{'content'}</span>
	</div>

	<style>
		:global(.outer) .inner {
			color: red;
		}

		:global(div) .foo {
			color: blue;
		}
	</style>
}`;
		const { css } = compile(source, 'test.tsrx');

		expect(css).toMatch(/\.outer \.inner\.tsrx-[a-z0-9]+ {/);
		expect(css).toMatch(/\(unused\) :global\(div\) \.foo {/);
	});

	it('handles :global with ID selectors', () => {
		const source = `
export component Test() {
	<div id="app">
		<div id="content">{'text'}</div>
	</div>

	<style>
		:global(#app) {
			width: 100%;
		}

		:global(#app) #content {
			padding: 20px;
		}

		div :global(#content) {
			margin: 0;
		}
	</style>
}`;
		const { css } = compile(source, 'test.tsrx');

		expect(css).toContain('#app {');
		expect(css).not.toContain('#app #content {');
		expect(css).not.toMatch(/#app\.tsrx-[a-z0-9]+/);
		expect(css).toMatch(/div\.tsrx-[a-z0-9]+ #content {/);
	});

	it('handles :global with class and ID combination', () => {
		const source = `
export component Test() {
	<div id="app" class="container">{'content'}</div>

	<style>
		:global(#app.container) {
			color: red;
		}

		:global(.container)#app {
			color: blue;
		}

		#app:global(.container) {
			color: green;
		}
	</style>
}`;
		const { css } = compile(source, 'test.tsrx');

		expect(css).toContain('#app.container {');
		expect(css).toMatch(/\.container#app\.tsrx-[a-z0-9]+ {/);
		expect(css).toMatch(/#app\.tsrx-[a-z0-9]+\.container {/);
	});

	it('handles multiple classes with :global', () => {
		const source = `
export component Test() {
	<div class="a b c">{'content'}</div>

	<style>
		:global(.a).b.c {
			color: red;
		}

		.a:global(.b).c {
			color: blue;
		}

		.a.b:global(.c) {
			color: green;
		}
	</style>
}`;
		const { css } = compile(source, 'test.tsrx');

		expect((css.match(/\.a\.b\.c\.tsrx-[a-z0-9]+ {/g) || []).length).toBe(2);
		expect(css).toMatch(/\.a\.b\.tsrx-[a-z0-9]+\.c {/);
	});

	it('handles :global with class descendant selectors', () => {
		const source = `
export component Test() {
	<div class="outer">
		<div class="middle">
			<div class="inner">{'content'}</div>
		</div>
	</div>

	<style>
		:global(.outer) .middle .inner {
			color: red;
		}

		.outer :global(.middle .inner) {
			color: blue;
		}

		.outer .middle:global(.inner) {
			color: green;
		}
	</style>
}`;
		const { css } = compile(source, 'test.tsrx');

		expect(css).toMatch(/\.outer \.middle\.tsrx-[a-z0-9]+ \.inner:where\(\.tsrx-[a-z0-9]+\)/);
		expect(css).toMatch(/\.outer\.tsrx-[a-z0-9]+ \.middle \.inner {/);
		expect(css).toMatch(/\.outer\.tsrx-[a-z0-9]+ \.middle:where\(\.tsrx-[a-z0-9]+\)\.inner/);
	});
});
