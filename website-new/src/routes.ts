import { RenderRoute, ServerRoute } from '@ripple-ts/vite-plugin';

export const routes = [
	new RenderRoute({ path: '/', entry: '/src/pages/index.ripple' }),
	new RenderRoute({
		path: '/docs/introduction',
		entry: '/src/pages/docs/introduction.ripple',
	}),
	// BROKEN: This route must be the last one, as it catches all other routes.
	// But it should be propably ** (as catch all - not / [index] catch all).
	new RenderRoute({ path: '/**', entry: '/src/pages/404.ripple' }),
	new ServerRoute({
		path: '/api/hello',
		methods: ['GET'],
		handler: async (context) => {
			console.log('[handler] inside handler', context.url.pathname);

			return Response.json({
				message: 'Hello from Ripple SSR!',
				timestamp: new Date().toISOString(),
			});
		},
	}),
	new ServerRoute({
		path: '/api/message',
		methods: ['GET'],
		handler: async (_) => {
			const codeContent =
				btoa(`<span class="line-number"> 1</span> <span class="export-keyword">import</span> <span class="brace">{</span> <span class="property">Button</span> <span class="brace">}</span> <span class="export-keyword">from</span> <span class="string">'./Button.ripple'</span>;
<span class="line-number"> 2</span> <span class="export-keyword">import</span> <span class="brace">{</span> <span class="property">track</span> <span class="brace">}</span> <span class="export-keyword">from</span> <span class="string">'ripple'</span>;
<span class="line-number"> 3</span>
<span class="line-number"> 4</span> <span class="export-keyword">export</span> <span class="keyword">component</span> <span class="function">TodoList</span><span class="brace">(</span><span class="brace">{</span> <span class="property">todos</span>, <span class="property">addTodo</span> <span class="brace">}</span>: <span class="component">Props</span><span class="brace">)</span> <span class="brace">{</span>
<span class="line-number"> 5</span>   <span class="bracket">&lt;</span><span class="tag">div</span> <span class="attribute">class</span>=<span class="string">"container"</span><span class="bracket">&gt;</span>
<span class="line-number"> 6</span>     <span class="bracket">&lt;</span><span class="tag">h2</span><span class="bracket">&gt;</span><span class="template-brace">{</span><span class="string">"Todo List"</span><span class="template-brace">}</span><span class="bracket">&lt;/</span><span class="tag">h2</span><span class="bracket">&gt;</span>
<span class="line-number"> 7</span>     <span class="bracket">&lt;</span><span class="tag">ul</span><span class="bracket">&gt;</span>
<span class="line-number"> 8</span>       <span class="control-keyword">for</span> <span class="brace">(</span><span class="keyword">const</span> <span class="property">todo</span> <span class="keyword">of</span> <span class="ripple-syntax">todos</span><span class="brace">)</span> <span class="block-brace">{</span>
<span class="line-number"> 9</span>         <span class="bracket">&lt;</span><span class="tag">li</span><span class="bracket">&gt;</span><span class="template-brace">{</span><span class="property">todo.text</span><span class="template-brace">}</span><span class="bracket">&lt;/</span><span class="tag">li</span><span class="bracket">&gt;</span>
<span class="line-number">10</span>       <span class="block-brace">}</span>
<span class="line-number">11</span>     <span class="bracket">&lt;/</span><span class="tag">ul</span><span class="bracket">&gt;</span>
<span class="line-number">12</span>
<span class="line-number">13</span>     <span class="control-keyword">if</span> <span class="brace">(</span><span class="ripple-syntax">todos</span>.<span class="property">length</span> <span class="keyword">&gt;</span> <span class="value">0</span><span class="brace">)</span> <span class="block-brace">{</span>
<span class="line-number">14</span>       <span class="bracket">&lt;</span><span class="tag">p</span><span class="bracket">&gt;</span><span class="template-brace">{</span><span class="ripple-syntax">todos</span>.<span class="property">length</span><span class="template-brace">}</span><span class="template-brace">{</span><span class="string">" items"</span><span class="template-brace">}</span><span class="bracket">&lt;/</span><span class="tag">p</span><span class="bracket">&gt;</span>
<span class="line-number">15</span>     <span class="block-brace">}</span>
<span class="line-number">16</span>
<span class="line-number">17</span>     <span class="bracket">&lt;</span><span class="component">Button</span> <span class="attribute">onClick</span>=<span class="template-brace">{</span><span class="property">addTodo</span><span class="template-brace">}</span> <span class="attribute">label</span>=<span class="template-brace">{</span><span class="string">"Add Todo"</span><span class="template-brace">}</span> <span class="bracket">/&gt;</span>
<span class="line-number">18</span>   <span class="bracket">&lt;/</span><span class="tag">div</span><span class="bracket">&gt;</span>
<span class="line-number">19</span>
<span class="line-number">20</span>   <span class="bracket">&lt;</span><span class="tag">style</span><span class="bracket">&gt;</span>
<span class="line-number">21</span>     <span class="css-selector">.container</span> <span class="css-brace">{</span>
<span class="line-number">22</span>       <span class="attribute">text-align</span>: <span class="value">center</span>;
<span class="line-number">23</span>       <span class="attribute">font-family</span>: <span class="string">"Arial"</span>, <span class="value">sans-serif</span>;
<span class="line-number">24</span>     <span class="css-brace">}</span>
<span class="line-number">25</span>   <span class="bracket">&lt;/</span><span class="tag">style</span><span class="bracket">&gt;</span>
<span class="line-number">26</span> <span class="brace">}</span>
<span class="line-number">27</span>
<span class="line-number">28</span> <span class="export-keyword">export</span> <span class="keyword">component</span> <span class="function">Counter</span><span class="brace">()</span> <span class="brace">{</span>
<span class="line-number">29</span>   <span class="keyword">let</span> <span class="property">count</span> <span class="operator">=</span> <span class="function">track</span><span class="brace">(</span><span class="value">0</span><span class="brace">)</span>;
<span class="line-number">30</span>   <span class="keyword">let</span> <span class="property">double</span> <span class="operator">=</span> <span class="function">track</span><span class="brace">(</span><span class="brace">()</span> <span class="operator">=&gt;</span> <span class="reactive-var">@count</span> <span class="operator">*</span> <span class="value">2</span><span class="brace">)</span>;
<span class="line-number">31</span>
<span class="line-number">32</span>   <span class="bracket">&lt;</span><span class="tag">div</span> <span class="attribute">class</span>=<span class="string">"counter"</span><span class="bracket">&gt;</span>
<span class="line-number">33</span>     <span class="bracket">&lt;</span><span class="tag">h2</span><span class="bracket">&gt;</span><span class="template-brace">{</span><span class="string">"Counter"</span><span class="template-brace">}</span><span class="bracket">&lt;/</span><span class="tag">h2</span><span class="bracket">&gt;</span>
<span class="line-number">34</span>     <span class="bracket">&lt;</span><span class="tag">p</span><span class="bracket">&gt;</span><span class="template-brace">{</span><span class="string">"Count: "</span><span class="template-brace">}</span><span class="template-brace">{</span><span class="reactive-var">@count</span><span class="template-brace">}</span><span class="bracket">&lt;/</span><span class="tag">p</span><span class="bracket">&gt;</span>
<span class="line-number">35</span>     <span class="bracket">&lt;</span><span class="tag">p</span><span class="bracket">&gt;</span><span class="template-brace">{</span><span class="string">"Double: "</span><span class="template-brace">}</span><span class="template-brace">{</span><span class="reactive-var">@double</span><span class="template-brace">}</span><span class="bracket">&lt;/</span><span class="tag">p</span><span class="bracket">&gt;</span>
<span class="line-number">36</span>
<span class="line-number">37</span>     <span class="bracket">&lt;</span><span class="component">Button</span> <span class="attribute">onClick</span>=<span class="template-brace">{</span><span class="brace">()</span> <span class="operator">=&gt;</span> <span class="reactive-var">@count</span><span class="operator">++</span><span class="template-brace">}</span> <span class="attribute">label</span>=<span class="template-brace">{</span><span class="string">"Increment"</span><span class="template-brace">}</span> <span class="bracket">/&gt;</span>
<span class="line-number">38</span>     <span class="bracket">&lt;</span><span class="component">Button</span> <span class="attribute">onClick</span>=<span class="template-brace">{</span><span class="brace">()</span> <span class="operator">=&gt;</span> <span class="reactive-var">@count</span> <span class="operator">=</span> <span class="value">0</span><span class="template-brace">}</span> <span class="attribute">label</span>=<span class="template-brace">{</span><span class="string">"Reset"</span><span class="template-brace">}</span> <span class="bracket">/&gt;</span>
<span class="line-number">39</span>   <span class="bracket">&lt;/</span><span class="tag">div</span><span class="bracket">&gt;</span>
<span class="line-number">40</span> <span class="brace">}</span>`);

			return Response.json({
				message: codeContent,
				timestamp: new Date().toISOString(),
			});
		},
	}),
];
