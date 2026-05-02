// --- Code snippets (hand-highlighted, matching homepage code-block style) ---

const COMPONENT_HTML = [
	'<span class="ln"> 1</span> <span class="kw-export">export</span> <span class="kw">component</span> <span class="fn">Button</span><span class="br">(</span><span class="br">{</span> <span class="prop">label</span>, <span class="prop">onClick</span> <span class="br">}</span>: <span class="br">{</span>',
	'<span class="ln"> 2</span>   <span class="prop">label</span>: <span class="type">string</span>;',
	'<span class="ln"> 3</span>   <span class="prop">onClick</span>: <span class="br">(</span><span class="br">)</span> =&gt; <span class="type">void</span>;',
	'<span class="ln"> 4</span> <span class="br">}</span><span class="br">)</span> <span class="br">{</span>',
	'<span class="ln"> 5</span>   <span class="tag">&lt;</span><span class="el">button</span> <span class="attr">class</span>=<span class="str">"btn"</span> <span class="tbr">{</span><span class="prop">onClick</span><span class="tbr">}</span><span class="tag">&gt;</span>',
	'<span class="ln"> 6</span>     <span class="tbr">{</span><span class="prop">label</span><span class="tbr">}</span>',
	'<span class="ln"> 7</span>   <span class="tag">&lt;/</span><span class="el">button</span><span class="tag">&gt;</span>',
	'<span class="ln"> 8</span>',
	'<span class="ln"> 9</span>   <span class="tag">&lt;</span><span class="el">style</span><span class="tag">&gt;</span>',
	'<span class="ln">10</span>     <span class="css-sel">.btn</span> <span class="css-br">{</span>',
	'<span class="ln">11</span>       <span class="attr">padding</span>: <span class="val">0.5rem 1rem</span>;',
	'<span class="ln">12</span>       <span class="attr">border-radius</span>: <span class="val">4px</span>;',
	'<span class="ln">13</span>     <span class="css-br">}</span>',
	'<span class="ln">14</span>   <span class="tag">&lt;/</span><span class="el">style</span><span class="tag">&gt;</span>',
	'<span class="ln">15</span> <span class="br">}</span>',
].join('\n');

const BAILOUT_HTML = [
	'<span class="ln"> 1</span> <span class="kw-export">export</span> <span class="kw">component</span> <span class="fn">Counter</span><span class="br">(</span><span class="br">)</span> <span class="br">{</span>',
	'<span class="ln"> 2</span>   <span class="kw">let</span> <span class="prop">count</span> = <span class="val">0</span>;',
	'<span class="ln"> 3</span>',
	'<span class="ln"> 4</span>   <span class="cmt">// Bail out of template rules with an inline function —</span>',
	'<span class="ln"> 5</span>   <span class="cmt">// plain JS/TS control flow, no JSX-statement restrictions.</span>',
	'<span class="ln"> 6</span>   <span class="kw">const</span> <span class="prop">increment</span> = <span class="br">(</span><span class="br">)</span> =&gt; <span class="br">{</span>',
	'<span class="ln"> 7</span>     <span class="kw">if</span> <span class="br">(</span><span class="prop">count</span> &gt;= <span class="val">10</span><span class="br">)</span> <span class="br">{</span>',
	'<span class="ln"> 8</span>       <span class="prop">count</span> = <span class="val">0</span>;',
	'<span class="ln"> 9</span>     <span class="br">}</span> <span class="kw">else</span> <span class="br">{</span>',
	'<span class="ln">10</span>       <span class="prop">count</span> += <span class="val">1</span>;',
	'<span class="ln">11</span>     <span class="br">}</span>',
	'<span class="ln">12</span>   <span class="br">}</span>;',
	'<span class="ln">13</span>',
	'<span class="ln">14</span>   <span class="tag">&lt;</span><span class="el">button</span> <span class="attr">onClick</span>=<span class="tbr">{</span><span class="prop">increment</span><span class="tbr">}</span><span class="tag">&gt;</span>',
	'<span class="ln">15</span>     <span class="str">"Count: "</span><span class="tbr">{</span><span class="prop">count</span><span class="tbr">}</span>',
	'<span class="ln">16</span>   <span class="tag">&lt;/</span><span class="el">button</span><span class="tag">&gt;</span>',
	'<span class="ln">17</span> <span class="br">}</span>',
].join('\n');

const STATEMENT_HTML = [
	'<span class="ln">1</span> <span class="kw">component</span> <span class="fn">Greeting</span><span class="br">(</span><span class="br">)</span> <span class="br">{</span>',
	'<span class="ln">2</span>   <span class="tag">&lt;</span><span class="el">h1</span><span class="tag">&gt;</span><span class="str">"Hello World"</span><span class="tag">&lt;/</span><span class="el">h1</span><span class="tag">&gt;</span>',
	'<span class="ln">3</span>   <span class="tag">&lt;</span><span class="el">p</span><span class="tag">&gt;</span><span class="str">"Welcome to TSRX."</span><span class="tag">&lt;/</span><span class="el">p</span><span class="tag">&gt;</span>',
	'<span class="ln">4</span> <span class="br">}</span>',
].join('\n');

const TSX_EXPR_HTML = [
	'<span class="ln">1</span> <span class="kw">component</span> <span class="fn">App</span><span class="br">(</span><span class="br">)</span> <span class="br">{</span>',
	'<span class="ln">2</span>   <span class="kw">const</span> <span class="prop">title</span> = <span class="tag">&lt;</span><span class="tag">&gt;</span><span class="tag">&lt;</span><span class="el">span</span> <span class="attr">class</span>=<span class="str">"title"</span><span class="tag">&gt;</span><span class="str">"Settings"</span><span class="tag">&lt;/</span><span class="el">span</span><span class="tag">&gt;</span><span class="tag">&lt;/</span><span class="tag">&gt;</span>;',
	'<span class="ln">3</span>   <span class="tag">&lt;</span><span class="el">Card</span> <span class="tbr">{</span><span class="prop">title</span><span class="tbr">}</span> <span class="tag">/&gt;</span>',
	'<span class="ln">4</span> <span class="br">}</span>',
].join('\n');

const TEXT_EXPR_HTML = [
	'<span class="ln">1</span> <span class="kw">component</span> <span class="fn">Inbox</span><span class="br">(</span><span class="br">{</span> <span class="prop">name</span>, <span class="prop">count</span> <span class="br">}</span>: <span class="br">{</span> <span class="prop">name</span>: <span class="type">string</span>; <span class="prop">count</span>: <span class="type">number</span> <span class="br">}</span><span class="br">)</span> <span class="br">{</span>',
	'<span class="ln">2</span>   <span class="tag">&lt;</span><span class="el">p</span><span class="tag">&gt;</span><span class="str">"Hello, "</span><span class="tbr">{</span><span class="prop">name</span><span class="tbr">}</span><span class="str">"!"</span><span class="tag">&lt;/</span><span class="el">p</span><span class="tag">&gt;</span>',
	'<span class="ln">3</span>   <span class="tag">&lt;</span><span class="el">p</span><span class="tag">&gt;</span><span class="tbr">{</span><span class="str">`You have ${</span><span class="prop">count</span><span class="str">} unread messages`</span><span class="tbr">}</span><span class="tag">&lt;/</span><span class="el">p</span><span class="tag">&gt;</span>',
	'<span class="ln">4</span>   <span class="tag">&lt;</span><span class="el">p</span><span class="tag">&gt;</span><span class="tbr">{</span><span class="prop">count</span> &gt; <span class="val">0</span> ? <span class="str">\'Check your inbox.\'</span> : <span class="str">\'All caught up.\'</span><span class="tbr">}</span><span class="tag">&lt;/</span><span class="el">p</span><span class="tag">&gt;</span>',
	'<span class="ln">5</span> <span class="br">}</span>',
].join('\n');

const TEXT_KW_HTML = [
	'<span class="ln">1</span> <span class="kw">component</span> <span class="fn">Price</span><span class="br">(</span><span class="br">{</span> <span class="prop">amount</span> <span class="br">}</span>: <span class="br">{</span> <span class="prop">amount</span>: <span class="type">number</span> <span class="br">}</span><span class="br">)</span> <span class="br">{</span>',
	'<span class="ln">2</span>   <span class="cmt">// {text ...} forces text-node rendering — the value is stringified</span>',
	'<span class="ln">3</span>   <span class="cmt">// and escaped, even if it happens to contain &lt; or &amp; characters.</span>',
	'<span class="ln">4</span>   <span class="tag">&lt;</span><span class="el">span</span><span class="tag">&gt;</span><span class="tbr">{</span><span class="kw">text</span> <span class="prop">amount</span><span class="tbr">}</span><span class="tag">&lt;/</span><span class="el">span</span><span class="tag">&gt;</span>',
	'<span class="ln">5</span> <span class="br">}</span>',
].join('\n');

const HTML_KW_HTML = [
	'<span class="ln">1</span> <span class="kw">component</span> <span class="fn">Article</span><span class="br">(</span><span class="br">{</span> <span class="prop">markup</span> <span class="br">}</span>: <span class="br">{</span> <span class="prop">markup</span>: <span class="type">string</span> <span class="br">}</span><span class="br">)</span> <span class="br">{</span>',
	'<span class="ln">2</span>   <span class="cmt">// {html ...} inserts the value as raw HTML — no escaping.</span>',
	'<span class="ln">3</span>   <span class="cmt">// Only use on trusted input; this is equivalent to innerHTML.</span>',
	'<span class="ln">4</span>   <span class="tag">&lt;</span><span class="el">article</span><span class="tag">&gt;</span><span class="tbr">{</span><span class="kw">html</span> <span class="prop">markup</span><span class="tbr">}</span><span class="tag">&lt;/</span><span class="el">article</span><span class="tag">&gt;</span>',
	'<span class="ln">5</span> <span class="br">}</span>',
].join('\n');

const IF_HTML = [
	'<span class="ln"> 1</span> <span class="kw">component</span> <span class="fn">StatusBadge</span><span class="br">(</span><span class="br">{</span> <span class="prop">status</span> <span class="br">}</span>: <span class="br">{</span> <span class="prop">status</span>: <span class="type">string</span> <span class="br">}</span><span class="br">)</span> <span class="br">{</span>',
	'<span class="ln"> 2</span>   <span class="tag">&lt;</span><span class="el">div</span><span class="tag">&gt;</span>',
	'<span class="ln"> 3</span>     <span class="kw">if</span> <span class="br">(</span><span class="prop">status</span> === <span class="str">\'active\'</span><span class="br">)</span> <span class="br">{</span>',
	'<span class="ln"> 4</span>       <span class="tag">&lt;</span><span class="el">span</span> <span class="attr">class</span>=<span class="str">"badge active"</span><span class="tag">&gt;</span><span class="str">"Online"</span><span class="tag">&lt;/</span><span class="el">span</span><span class="tag">&gt;</span>',
	'<span class="ln"> 5</span>     <span class="br">}</span> <span class="kw">else if</span> <span class="br">(</span><span class="prop">status</span> === <span class="str">\'idle\'</span><span class="br">)</span> <span class="br">{</span>',
	'<span class="ln"> 6</span>       <span class="tag">&lt;</span><span class="el">span</span> <span class="attr">class</span>=<span class="str">"badge idle"</span><span class="tag">&gt;</span><span class="str">"Away"</span><span class="tag">&lt;/</span><span class="el">span</span><span class="tag">&gt;</span>',
	'<span class="ln"> 7</span>     <span class="br">}</span> <span class="kw">else</span> <span class="br">{</span>',
	'<span class="ln"> 8</span>       <span class="tag">&lt;</span><span class="el">span</span> <span class="attr">class</span>=<span class="str">"badge"</span><span class="tag">&gt;</span><span class="str">"Offline"</span><span class="tag">&lt;/</span><span class="el">span</span><span class="tag">&gt;</span>',
	'<span class="ln"> 9</span>     <span class="br">}</span>',
	'<span class="ln">10</span>   <span class="tag">&lt;/</span><span class="el">div</span><span class="tag">&gt;</span>',
	'<span class="ln">11</span> <span class="br">}</span>',
].join('\n');

const FOR_HTML = [
	'<span class="ln">1</span> <span class="kw">component</span> <span class="fn">TodoList</span><span class="br">(</span><span class="br">{</span> <span class="prop">items</span> <span class="br">}</span>: <span class="br">{</span> <span class="prop">items</span>: <span class="type">Todo</span><span class="br">[</span><span class="br">]</span> <span class="br">}</span><span class="br">)</span> <span class="br">{</span>',
	'<span class="ln">2</span>   <span class="tag">&lt;</span><span class="el">ul</span><span class="tag">&gt;</span>',
	'<span class="ln">3</span>     <span class="kw">for</span> <span class="br">(</span><span class="kw">const</span> <span class="prop">item</span> <span class="kw">of</span> <span class="prop">items</span>; <span class="kw">index</span> <span class="prop">i</span>; <span class="kw">key</span> <span class="prop">item</span>.<span class="prop">id</span><span class="br">)</span> <span class="br">{</span>',
	'<span class="ln">4</span>       <span class="tag">&lt;</span><span class="el">li</span><span class="tag">&gt;</span><span class="tbr">{</span><span class="prop">i</span> + <span class="val">1</span><span class="tbr">}</span><span class="str">". "</span><span class="tbr">{</span><span class="prop">item</span>.<span class="prop">text</span><span class="tbr">}</span><span class="tag">&lt;/</span><span class="el">li</span><span class="tag">&gt;</span>',
	'<span class="ln">5</span>     <span class="br">}</span>',
	'<span class="ln">6</span>   <span class="tag">&lt;/</span><span class="el">ul</span><span class="tag">&gt;</span>',
	'<span class="ln">7</span> <span class="br">}</span>',
].join('\n');

const TRY_HTML = [
	'<span class="ln">1</span> <span class="kw">component</span> <span class="fn">SafeProfile</span><span class="br">(</span><span class="br">{</span> <span class="prop">userId</span> <span class="br">}</span>: <span class="br">{</span> <span class="prop">userId</span>: <span class="type">string</span> <span class="br">}</span><span class="br">)</span> <span class="br">{</span>',
	'<span class="ln">2</span>   <span class="kw">try</span> <span class="br">{</span>',
	'<span class="ln">3</span>     <span class="tag">&lt;</span><span class="el">UserProfile</span> <span class="attr">id</span>=<span class="tbr">{</span><span class="prop">userId</span><span class="tbr">}</span> <span class="tag">/&gt;</span>',
	'<span class="ln">4</span>   <span class="br">}</span> <span class="kw">catch</span> <span class="br">(</span><span class="prop">error</span><span class="br">)</span> <span class="br">{</span>',
	'<span class="ln">5</span>     <span class="tag">&lt;</span><span class="el">div</span> <span class="attr">class</span>=<span class="str">"error"</span><span class="tag">&gt;</span>',
	'<span class="ln">6</span>       <span class="tag">&lt;</span><span class="el">p</span><span class="tag">&gt;</span><span class="str">"Something went wrong."</span><span class="tag">&lt;/</span><span class="el">p</span><span class="tag">&gt;</span>',
	'<span class="ln">7</span>     <span class="tag">&lt;/</span><span class="el">div</span><span class="tag">&gt;</span>',
	'<span class="ln">8</span>   <span class="br">}</span>',
	'<span class="ln">9</span> <span class="br">}</span>',
].join('\n');

const RETURN_HTML = [
	'<span class="ln"> 1</span> <span class="kw">component</span> <span class="fn">Dashboard</span><span class="br">(</span><span class="br">{</span> <span class="prop">user</span> <span class="br">}</span>: <span class="br">{</span> <span class="prop">user</span>: <span class="type">User</span> | <span class="type">null</span> <span class="br">}</span><span class="br">)</span> <span class="br">{</span>',
	'<span class="ln"> 2</span>   <span class="kw">if</span> <span class="br">(</span>!<span class="prop">user</span><span class="br">)</span> <span class="br">{</span>',
	'<span class="ln"> 3</span>     <span class="tag">&lt;</span><span class="el">p</span><span class="tag">&gt;</span><span class="str">"Please sign in."</span><span class="tag">&lt;/</span><span class="el">p</span><span class="tag">&gt;</span>',
	'<span class="ln"> 4</span>     <span class="kw-ctrl">return</span>;',
	'<span class="ln"> 5</span>   <span class="br">}</span>',
	'<span class="ln"> 6</span>',
	'<span class="ln"> 7</span>   <span class="tag">&lt;</span><span class="el">h1</span><span class="tag">&gt;</span><span class="str">"Welcome, "</span><span class="tbr">{</span><span class="prop">user</span>.<span class="prop">name</span><span class="tbr">}</span><span class="tag">&lt;/</span><span class="el">h1</span><span class="tag">&gt;</span>',
	'<span class="ln"> 8</span>   <span class="tag">&lt;</span><span class="el">p</span><span class="tag">&gt;</span><span class="str">"Here is your dashboard."</span><span class="tag">&lt;/</span><span class="el">p</span><span class="tag">&gt;</span>',
	'<span class="ln"> 9</span> <span class="br">}</span>',
].join('\n');

const SWITCH_HTML = [
	'<span class="ln"> 1</span> <span class="kw">component</span> <span class="fn">StatusMessage</span><span class="br">(</span><span class="br">{</span> <span class="prop">status</span> <span class="br">}</span>: <span class="br">{</span> <span class="prop">status</span>: <span class="type">string</span> <span class="br">}</span><span class="br">)</span> <span class="br">{</span>',
	'<span class="ln"> 2</span>   <span class="kw">switch</span> <span class="br">(</span><span class="prop">status</span><span class="br">)</span> <span class="br">{</span>',
	'<span class="ln"> 3</span>     <span class="kw">case</span> <span class="str">\'loading\'</span>:',
	'<span class="ln"> 4</span>       <span class="tag">&lt;</span><span class="el">p</span><span class="tag">&gt;</span><span class="str">"Loading..."</span><span class="tag">&lt;/</span><span class="el">p</span><span class="tag">&gt;</span>',
	'<span class="ln"> 5</span>       <span class="kw-ctrl">break</span>;',
	'<span class="ln"> 6</span>     <span class="kw">case</span> <span class="str">\'success\'</span>:',
	'<span class="ln"> 7</span>       <span class="tag">&lt;</span><span class="el">p</span> <span class="attr">class</span>=<span class="str">"success"</span><span class="tag">&gt;</span><span class="str">"Done!"</span><span class="tag">&lt;/</span><span class="el">p</span><span class="tag">&gt;</span>',
	'<span class="ln"> 8</span>       <span class="kw-ctrl">break</span>;',
	'<span class="ln"> 9</span>     <span class="kw">default</span>:',
	'<span class="ln">10</span>       <span class="tag">&lt;</span><span class="el">p</span><span class="tag">&gt;</span><span class="str">"Unknown status."</span><span class="tag">&lt;/</span><span class="el">p</span><span class="tag">&gt;</span>',
	'<span class="ln">11</span>   <span class="br">}</span>',
	'<span class="ln">12</span> <span class="br">}</span>',
].join('\n');

const SHORTHAND_HTML = [
	'<span class="ln">1</span> <span class="cmt">// Instead of repeating the name:</span>',
	'<span class="ln">2</span> <span class="tag">&lt;</span><span class="el">Input</span> <span class="attr">value</span>=<span class="tbr">{</span><span class="prop">value</span><span class="tbr">}</span> <span class="attr">onChange</span>=<span class="tbr">{</span><span class="prop">onChange</span><span class="tbr">}</span> <span class="tag">/&gt;</span>',
	'<span class="ln">3</span>',
	'<span class="ln">4</span> <span class="cmt">// Use the shorthand:</span>',
	'<span class="ln">5</span> <span class="tag">&lt;</span><span class="el">Input</span> <span class="tbr">{</span><span class="prop">value</span><span class="tbr">}</span> <span class="tbr">{</span><span class="prop">onChange</span><span class="tbr">}</span> <span class="tag">/&gt;</span>',
].join('\n');

const REFS_HTML = [
	'<span class="ln"> 1</span> <span class="kw">component</span> <span class="fn">AutoFocus</span><span class="br">(</span><span class="br">)</span> <span class="br">{</span>',
	'<span class="ln"> 2</span>   <span class="kw">let</span> <span class="prop">input</span>: <span class="type">HTMLInputElement</span> | <span class="type">undefined</span>;',
	'<span class="ln"> 3</span>',
	'<span class="ln"> 4</span>   <span class="cmt">// Mutable-variable ref — Solid, Ripple only</span>',
	'<span class="ln"> 5</span>   <span class="tag">&lt;</span><span class="el">input</span> <span class="tbr">{</span><span class="kw">ref</span> <span class="prop">input</span><span class="tbr">}</span> <span class="attr">type</span>=<span class="str">"text"</span> <span class="tag">/&gt;</span>',
	'<span class="ln"> 6</span>',
	'<span class="ln"> 7</span>   <span class="cmt">// Callback ref — works on every target</span>',
	'<span class="ln"> 8</span>   <span class="tag">&lt;</span><span class="el">input</span> <span class="tbr">{</span><span class="kw">ref</span> <span class="br">(</span><span class="prop">node</span><span class="br">)</span> =&gt; <span class="prop">node</span>.<span class="fn">focus</span><span class="br">(</span><span class="br">)</span><span class="tbr">}</span> <span class="tag">/&gt;</span>',
	'<span class="ln"> 9</span> <span class="br">}</span>',
].join('\n');

const REFS_TRACKED_HTML = [
	'<span class="ln"> 1</span> <span class="kw">import</span> <span class="br">{</span> <span class="prop">track</span> <span class="br">}</span> <span class="kw">from</span> <span class="str">\'ripple\'</span>;',
	'<span class="ln"> 2</span>',
	'<span class="ln"> 3</span> <span class="kw">component</span> <span class="fn">App</span><span class="br">(</span><span class="br">)</span> <span class="br">{</span>',
	'<span class="ln"> 4</span>   <span class="cmt">// Ripple: a Tracked is a reactive ref slot — read via .value.</span>',
	'<span class="ln"> 5</span>   <span class="kw">const</span> <span class="prop">inputRef</span> = <span class="fn">track</span><span class="br">&lt;</span><span class="type">HTMLInputElement</span> | <span class="type">null</span><span class="br">&gt;</span><span class="br">(</span><span class="val">null</span><span class="br">)</span>;',
	'<span class="ln"> 6</span>',
	'<span class="ln"> 7</span>   <span class="tag">&lt;</span><span class="el">input</span> <span class="tbr">{</span><span class="kw">ref</span> <span class="prop">inputRef</span><span class="tbr">}</span> <span class="attr">type</span>=<span class="str">"text"</span> <span class="tag">/&gt;</span>',
	'<span class="ln"> 8</span>   <span class="cmt">// later: inputRef.value is the input element</span>',
	'<span class="ln"> 9</span> <span class="br">}</span>',
].join('\n');

const REFS_OBJECT_HTML = [
	'<span class="ln"> 1</span> <span class="kw">import</span> <span class="br">{</span> <span class="prop">useRef</span> <span class="br">}</span> <span class="kw">from</span> <span class="str">\'react\'</span>;',
	'<span class="ln"> 2</span>',
	'<span class="ln"> 3</span> <span class="kw">component</span> <span class="fn">SearchBox</span><span class="br">(</span><span class="br">)</span> <span class="br">{</span>',
	'<span class="ln"> 4</span>   <span class="cmt">// React/Preact: ref={useRef()}; Vue: ref={ref()} or useTemplateRef().</span>',
	'<span class="ln"> 5</span>   <span class="kw">const</span> <span class="prop">inputRef</span> = <span class="fn">useRef</span><span class="br">&lt;</span><span class="type">HTMLInputElement</span><span class="br">&gt;</span><span class="br">(</span><span class="val">null</span><span class="br">)</span>;',
	'<span class="ln"> 6</span>   <span class="kw">function</span> <span class="fn">logNode</span><span class="br">(</span><span class="prop">node</span>: <span class="type">HTMLInputElement</span><span class="br">)</span> <span class="br">{</span> <span class="fn">console</span>.<span class="fn">log</span><span class="br">(</span><span class="prop">node</span><span class="br">)</span>; <span class="br">}</span>',
	'<span class="ln"> 7</span>',
	'<span class="ln"> 8</span>   <span class="cmt">// At most one ref={...} attribute + any number of {ref ...} callbacks.</span>',
	'<span class="ln"> 9</span>   <span class="tag">&lt;</span><span class="el">input</span> <span class="attr">ref</span>=<span class="tbr">{</span><span class="prop">inputRef</span><span class="tbr">}</span> <span class="tbr">{</span><span class="kw">ref</span> <span class="prop">logNode</span><span class="tbr">}</span> <span class="attr">type</span>=<span class="str">"text"</span> <span class="tag">/&gt;</span>',
	'<span class="ln">10</span> <span class="br">}</span>',
].join('\n');

const REFS_COMPOSITE_HTML = [
	'<span class="ln"> 1</span> <span class="kw">component</span> <span class="fn">TextField</span><span class="br">(</span><span class="prop">props</span><span class="br">)</span> <span class="br">{</span>',
	'<span class="ln"> 2</span>   <span class="cmt">// Spreading props forwards the ref onto the underlying DOM element.</span>',
	'<span class="ln"> 3</span>   <span class="tag">&lt;</span><span class="el">input</span> <span class="tbr">{</span>...<span class="prop">props</span><span class="tbr">}</span> <span class="tag">/&gt;</span>',
	'<span class="ln"> 4</span> <span class="br">}</span>',
	'<span class="ln"> 5</span>',
	'<span class="ln"> 6</span> <span class="kw">component</span> <span class="fn">Form</span><span class="br">(</span><span class="br">)</span> <span class="br">{</span>',
	'<span class="ln"> 7</span>   <span class="kw">function</span> <span class="fn">logNode</span><span class="br">(</span><span class="prop">node</span>: <span class="type">HTMLInputElement</span><span class="br">)</span> <span class="br">{</span>',
	'<span class="ln"> 8</span>     <span class="fn">console</span>.<span class="fn">log</span><span class="br">(</span><span class="prop">node</span><span class="br">)</span>;',
	'<span class="ln"> 9</span>   <span class="br">}</span>',
	'<span class="ln">10</span>',
	'<span class="ln">11</span>   <span class="cmt">// Composite refs work on React/Preact/Solid/Ripple. Use a callback or</span>',
	'<span class="ln">12</span>   <span class="cmt">// the target&apos;s ref-object primitive — plain mutable vars don&apos;t</span>',
	'<span class="ln">13</span>   <span class="cmt">// propagate across the component boundary.</span>',
	'<span class="ln">14</span>   <span class="tag">&lt;</span><span class="el">TextField</span> <span class="tbr">{</span><span class="kw">ref</span> <span class="prop">logNode</span><span class="tbr">}</span> <span class="tag">/&gt;</span>',
	'<span class="ln">15</span> <span class="br">}</span>',
].join('\n');

const SCOPING_HTML = [
	'<span class="ln"> 1</span> <span class="kw">component</span> <span class="fn">App</span><span class="br">(</span><span class="br">)</span> <span class="br">{</span>',
	'<span class="ln"> 2</span>   <span class="kw">const</span> <span class="prop">name</span> = <span class="str">\'World\'</span>;',
	'<span class="ln"> 3</span>',
	'<span class="ln"> 4</span>   <span class="tag">&lt;</span><span class="el">div</span><span class="tag">&gt;</span>',
	'<span class="ln"> 5</span>     <span class="cmt">// This is a new scope — you can declare variables here</span>',
	'<span class="ln"> 6</span>     <span class="kw">const</span> <span class="prop">greeting</span> = <span class="str">`Hello, ${</span><span class="prop">name</span><span class="str">}!`</span>;',
	'<span class="ln"> 7</span>     <span class="tag">&lt;</span><span class="el">h1</span><span class="tag">&gt;</span><span class="tbr">{</span><span class="prop">greeting</span><span class="tbr">}</span><span class="tag">&lt;/</span><span class="el">h1</span><span class="tag">&gt;</span>',
	'<span class="ln"> 8</span>   <span class="tag">&lt;/</span><span class="el">div</span><span class="tag">&gt;</span>',
	'<span class="ln"> 9</span> <span class="br">}</span>',
].join('\n');

const CHILDREN_HTML = [
	'<span class="ln"> 1</span> <span class="cmt">// Children as nested JSX — this works:</span>',
	'<span class="ln"> 2</span> <span class="tag">&lt;</span><span class="el">Card</span><span class="tag">&gt;</span>',
	'<span class="ln"> 3</span>   <span class="tag">&lt;</span><span class="el">h2</span><span class="tag">&gt;</span><span class="str">"Title"</span><span class="tag">&lt;/</span><span class="el">h2</span><span class="tag">&gt;</span>',
	'<span class="ln"> 4</span>   <span class="tag">&lt;</span><span class="el">p</span><span class="tag">&gt;</span><span class="str">"Content goes here."</span><span class="tag">&lt;/</span><span class="el">p</span><span class="tag">&gt;</span>',
	'<span class="ln"> 5</span> <span class="tag">&lt;/</span><span class="el">Card</span><span class="tag">&gt;</span>',
	'<span class="ln"> 6</span>',
	'<span class="ln"> 7</span> <span class="cmt">// Passing a function or array? Use the children prop:</span>',
	'<span class="ln"> 8</span> <span class="tag">&lt;</span><span class="el">List</span> <span class="attr">children</span>=<span class="tbr">{</span><span class="prop">items</span>.<span class="fn">map</span><span class="br">(</span><span class="prop">renderItem</span><span class="br">)</span><span class="tbr">}</span> <span class="tag">/&gt;</span>',
].join('\n');

const RENDER_PROPS_HTML = [
	'<span class="ln"> 1</span> <span class="kw">component</span> <span class="fn">App</span><span class="br">(</span><span class="br">{</span> <span class="prop">items</span> <span class="br">}</span>: <span class="br">{</span> <span class="prop">items</span>: <span class="type">Item</span><span class="br">[</span><span class="br">]</span> <span class="br">}</span><span class="br">)</span> <span class="br">{</span>',
	'<span class="ln"> 2</span>   <span class="kw">const</span> <span class="prop">renderItem</span> = <span class="br">(</span><span class="prop">item</span>: <span class="type">Item</span><span class="br">)</span> =&gt; <span class="tag">&lt;</span><span class="tag">&gt;</span>',
	'<span class="ln"> 3</span>     <span class="tag">&lt;</span><span class="el">li</span><span class="tag">&gt;</span><span class="tbr">{</span><span class="prop">item</span>.<span class="prop">label</span><span class="tbr">}</span><span class="tag">&lt;/</span><span class="el">li</span><span class="tag">&gt;</span>',
	'<span class="ln"> 4</span>   <span class="tag">&lt;/</span><span class="tag">&gt;</span>;',
	'<span class="ln"> 5</span>',
	'<span class="ln"> 6</span>   <span class="tag">&lt;</span><span class="el">List</span> <span class="attr">items</span>=<span class="tbr">{</span><span class="prop">items</span><span class="tbr">}</span> <span class="attr">render</span>=<span class="tbr">{</span><span class="prop">renderItem</span><span class="tbr">}</span> <span class="tag">/&gt;</span>',
	'<span class="ln"> 7</span> <span class="br">}</span>',
].join('\n');

const ASYNC_BOUNDARY_HTML = [
	'<span class="ln"> 1</span> <span class="kw">const</span> <span class="fn">UserProfile</span> = <span class="fn">lazy</span><span class="br">(</span><span class="br">(</span><span class="br">)</span> =&gt; <span class="fn">import</span><span class="br">(</span><span class="str">\'./UserProfile.tsrx\'</span><span class="br">)</span><span class="br">)</span>;',
	'<span class="ln"> 2</span>',
	'<span class="ln"> 3</span> <span class="kw-export">export</span> <span class="kw">component</span> <span class="fn">App</span><span class="br">(</span><span class="br">)</span> <span class="br">{</span>',
	'<span class="ln"> 4</span>   <span class="kw">try</span> <span class="br">{</span>',
	'<span class="ln"> 5</span>     <span class="tag">&lt;</span><span class="el">UserProfile</span> <span class="attr">id</span>=<span class="tbr">{</span><span class="val">1</span><span class="tbr">}</span> <span class="tag">/&gt;</span>',
	'<span class="ln"> 6</span>   <span class="br">}</span> <span class="kw">pending</span> <span class="br">{</span>',
	'<span class="ln"> 7</span>     <span class="tag">&lt;</span><span class="el">p</span><span class="tag">&gt;</span><span class="str">"Loading..."</span><span class="tag">&lt;/</span><span class="el">p</span><span class="tag">&gt;</span>',
	'<span class="ln"> 8</span>   <span class="br">}</span> <span class="kw">catch</span> <span class="br">(</span><span class="prop">e</span><span class="br">)</span> <span class="br">{</span>',
	'<span class="ln"> 9</span>     <span class="tag">&lt;</span><span class="el">p</span><span class="tag">&gt;</span><span class="str">"Something went wrong."</span><span class="tag">&lt;/</span><span class="el">p</span><span class="tag">&gt;</span>',
	'<span class="ln">10</span>   <span class="br">}</span>',
	'<span class="ln">11</span> <span class="br">}</span>',
].join('\n');

const SCOPED_STYLES_HTML = [
	'<span class="ln"> 1</span> <span class="kw">component</span> <span class="fn">Card</span><span class="br">(</span><span class="br">)</span> <span class="br">{</span>',
	'<span class="ln"> 2</span>   <span class="tag">&lt;</span><span class="el">div</span> <span class="attr">class</span>=<span class="str">"card"</span><span class="tag">&gt;</span>',
	'<span class="ln"> 3</span>     <span class="tag">&lt;</span><span class="el">h2</span><span class="tag">&gt;</span><span class="str">"Scoped title"</span><span class="tag">&lt;/</span><span class="el">h2</span><span class="tag">&gt;</span>',
	'<span class="ln"> 4</span>     <span class="tag">&lt;</span><span class="el">p</span><span class="tag">&gt;</span><span class="str">"Styles here won\'t leak out."</span><span class="tag">&lt;/</span><span class="el">p</span><span class="tag">&gt;</span>',
	'<span class="ln"> 5</span>   <span class="tag">&lt;/</span><span class="el">div</span><span class="tag">&gt;</span>',
	'<span class="ln"> 6</span>',
	'<span class="ln"> 7</span>   <span class="tag">&lt;</span><span class="el">style</span><span class="tag">&gt;</span>',
	'<span class="ln"> 8</span>     <span class="css-sel">.card</span> <span class="css-br">{</span>',
	'<span class="ln"> 9</span>       <span class="attr">padding</span>: <span class="val">1.5rem</span>;',
	'<span class="ln">10</span>       <span class="attr">border</span>: <span class="val">1px</span> <span class="val">solid</span> <span class="val">#ddd</span>;',
	'<span class="ln">11</span>     <span class="css-br">}</span>',
	'<span class="ln">12</span>',
	'<span class="ln">13</span>     <span class="css-sel">h2</span> <span class="css-br">{</span> <span class="attr">color</span>: <span class="val">#333</span>; <span class="css-br">}</span>',
	'<span class="ln">14</span>   <span class="tag">&lt;/</span><span class="el">style</span><span class="tag">&gt;</span>',
	'<span class="ln">15</span> <span class="br">}</span>',
].join('\n');

const STYLE_COMPOSITION_HTML = [
	'<span class="ln"> 1</span> <span class="kw">component</span> <span class="fn">Badge</span><span class="br">(</span><span class="br">{</span> <span class="prop">className</span> <span class="br">}</span>: <span class="br">{</span> <span class="prop">className</span>?: <span class="type">string</span> <span class="br">}</span><span class="br">)</span> <span class="br">{</span>',
	'<span class="ln"> 2</span>   <span class="tag">&lt;</span><span class="el">span</span> <span class="attr">class</span>=<span class="tbr">{</span><span class="str">`badge ${</span><span class="prop">className</span> ?? <span class="str">\'\'</span><span class="str">}`</span><span class="tbr">}</span><span class="tag">&gt;</span>',
	'<span class="ln"> 3</span>     <span class="str">"New"</span>',
	'<span class="ln"> 4</span>   <span class="tag">&lt;/</span><span class="el">span</span><span class="tag">&gt;</span>',
	'<span class="ln"> 5</span>',
	'<span class="ln"> 6</span>   <span class="tag">&lt;</span><span class="el">style</span><span class="tag">&gt;</span>',
	'<span class="ln"> 7</span>     <span class="css-sel">.badge</span> <span class="css-br">{</span> <span class="attr">padding</span>: <span class="val">0.25rem 0.5rem</span>; <span class="css-br">}</span>',
	'<span class="ln"> 8</span>   <span class="tag">&lt;/</span><span class="el">style</span><span class="tag">&gt;</span>',
	'<span class="ln"> 9</span> <span class="br">}</span>',
	'<span class="ln">10</span>',
	'<span class="ln">11</span> <span class="kw">component</span> <span class="fn">App</span><span class="br">(</span><span class="br">)</span> <span class="br">{</span>',
	'<span class="ln">12</span>   <span class="tag">&lt;</span><span class="el">Badge</span> <span class="attr">className</span>=<span class="tbr">{</span><span class="kw">style</span> <span class="str">\'highlight\'</span><span class="tbr">}</span> <span class="tag">/&gt;</span>',
	'<span class="ln">13</span>',
	'<span class="ln">14</span>   <span class="tag">&lt;</span><span class="el">style</span><span class="tag">&gt;</span>',
	'<span class="ln">15</span>     <span class="css-sel">.highlight</span> <span class="css-br">{</span> <span class="attr">background</span>: <span class="val">#e8f5e9</span>; <span class="attr">color</span>: <span class="val">#2e7d32</span>; <span class="css-br">}</span>',
	'<span class="ln">16</span>   <span class="tag">&lt;/</span><span class="el">style</span><span class="tag">&gt;</span>',
	'<span class="ln">17</span> <span class="br">}</span>',
].join('\n');

const REACT_HOOKS_HTML = [
	'<span class="ln"> 1</span> <span class="kw">import</span> <span class="br">{</span> <span class="prop">useState</span>, <span class="prop">useEffect</span> <span class="br">}</span> <span class="kw">from</span> <span class="str">\'react\'</span>;',
	'<span class="ln"> 2</span>',
	'<span class="ln"> 3</span> <span class="kw">component</span> <span class="fn">UserProfile</span><span class="br">(</span><span class="br">{</span> <span class="prop">user</span>, <span class="prop">posts</span> <span class="br">}</span>: <span class="br">{</span> <span class="prop">user</span>: <span class="type">User</span> | <span class="type">null</span>; <span class="prop">posts</span>: <span class="type">Post</span><span class="br">[</span><span class="br">]</span> <span class="br">}</span><span class="br">)</span> <span class="br">{</span>',
	'<span class="ln"> 4</span>   <span class="kw">if</span> <span class="br">(</span>!<span class="prop">user</span><span class="br">)</span> <span class="br">{</span>',
	'<span class="ln"> 5</span>     <span class="tag">&lt;</span><span class="el">p</span><span class="tag">&gt;</span><span class="str">"Please sign in."</span><span class="tag">&lt;/</span><span class="el">p</span><span class="tag">&gt;</span>',
	'<span class="ln"> 6</span>     <span class="kw-ctrl">return</span>;',
	'<span class="ln"> 7</span>   <span class="br">}</span>',
	'<span class="ln"> 8</span>',
	'<span class="ln"> 9</span>   <span class="cmt">// Hooks after a guard — this is fine in TSRX</span>',
	'<span class="ln">10</span>   <span class="kw">const</span> <span class="br">[</span><span class="prop">tab</span>, <span class="prop">setTab</span><span class="br">]</span> = <span class="fn">useState</span><span class="br">(</span><span class="str">\'overview\'</span><span class="br">)</span>;',
	'<span class="ln">11</span>',
	'<span class="ln">12</span>   <span class="tag">&lt;</span><span class="el">h1</span><span class="tag">&gt;</span><span class="tbr">{</span><span class="prop">user</span>.<span class="prop">name</span><span class="tbr">}</span><span class="tag">&lt;/</span><span class="el">h1</span><span class="tag">&gt;</span>',
	'<span class="ln">13</span>   <span class="tag">&lt;</span><span class="el">TabBar</span> <span class="attr">value</span>=<span class="tbr">{</span><span class="prop">tab</span><span class="tbr">}</span> <span class="attr">onChange</span>=<span class="tbr">{</span><span class="prop">setTab</span><span class="tbr">}</span> <span class="tag">/&gt;</span>',
	'<span class="ln">14</span>',
	'<span class="ln">15</span>   <span class="cmt">// Hooks inside a loop — the compiler extracts them</span>',
	'<span class="ln">16</span>   <span class="tag">&lt;</span><span class="el">ul</span><span class="tag">&gt;</span>',
	'<span class="ln">17</span>     <span class="kw">for</span> <span class="br">(</span><span class="kw">const</span> <span class="prop">post</span> <span class="kw">of</span> <span class="prop">posts</span><span class="br">)</span> <span class="br">{</span>',
	'<span class="ln">18</span>       <span class="fn">useEffect</span><span class="br">(</span><span class="br">(</span><span class="br">)</span> =&gt; <span class="br">{</span>',
	'<span class="ln">19</span>         <span class="fn">console</span>.<span class="fn">log</span><span class="br">(</span><span class="str">`viewed ${</span><span class="prop">post</span>.<span class="prop">title</span><span class="str">}`</span><span class="br">)</span>;',
	'<span class="ln">20</span>       <span class="br">}</span>, <span class="br">[</span><span class="prop">post</span>.<span class="prop">title</span><span class="br">]</span><span class="br">)</span>;',
	'<span class="ln">21</span>',
	'<span class="ln">22</span>       <span class="tag">&lt;</span><span class="el">li</span><span class="tag">&gt;</span><span class="tbr">{</span><span class="prop">post</span>.<span class="prop">title</span><span class="tbr">}</span><span class="tag">&lt;/</span><span class="el">li</span><span class="tag">&gt;</span>',
	'<span class="ln">23</span>     <span class="br">}</span>',
	'<span class="ln">24</span>   <span class="tag">&lt;/</span><span class="el">ul</span><span class="tag">&gt;</span>',
	'<span class="ln">25</span> <span class="br">}</span>',
].join('\n');

const LAZY_PROPS_HTML = [
	'<span class="ln">1</span> <span class="kw">component</span> <span class="fn">UserCard</span><span class="br">(</span>&amp;<span class="br">{</span> <span class="prop">name</span>, <span class="prop">age</span> <span class="br">}</span>: <span class="br">{</span> <span class="prop">name</span>: <span class="type">string</span>; <span class="prop">age</span>: <span class="type">number</span> <span class="br">}</span><span class="br">)</span> <span class="br">{</span>',
	'<span class="ln">2</span>   <span class="tag">&lt;</span><span class="el">div</span><span class="tag">&gt;</span>',
	'<span class="ln">3</span>     <span class="tag">&lt;</span><span class="el">h2</span><span class="tag">&gt;</span><span class="tbr">{</span><span class="prop">name</span><span class="tbr">}</span><span class="tag">&lt;/</span><span class="el">h2</span><span class="tag">&gt;</span>',
	'<span class="ln">4</span>     <span class="tag">&lt;</span><span class="el">p</span><span class="tag">&gt;</span><span class="str">"Age: "</span><span class="tbr">{</span><span class="prop">age</span><span class="tbr">}</span><span class="tag">&lt;/</span><span class="el">p</span><span class="tag">&gt;</span>',
	'<span class="ln">5</span>   <span class="tag">&lt;/</span><span class="el">div</span><span class="tag">&gt;</span>',
	'<span class="ln">6</span> <span class="br">}</span>',
].join('\n');

const NAV_ITEMS = [
	{ id: 'components', label: 'Components' },
	{ id: 'jsx', label: 'Statement-based JSX' },
	{ id: 'text-expressions', label: 'Text expressions' },
	{ id: 'raw-html', label: 'Raw HTML' },
	{ id: 'lazy-destructuring', label: 'Lazy destructuring' },
	{ id: 'prop-shorthands', label: 'Prop shorthands' },
	{ id: 'refs', label: 'DOM refs' },
	{ id: 'scoping', label: 'Lexical scoping' },
	{ id: 'children', label: 'Children & render props' },
	{ id: 'if', label: 'Conditional rendering' },
	{ id: 'for', label: 'List rendering' },
	{ id: 'switch', label: 'Switch statements' },
	{ id: 'try', label: 'Error boundaries' },
	{ id: 'async-boundaries', label: 'Async boundaries' },
	{ id: 'scoped-styles', label: 'Scoped styles' },
	{ id: 'style-composition', label: 'Style composition' },
	{ id: 'early-return', label: 'Early returns' },
	{ id: 'react-hooks', label: 'React & Preact Hooks' },
];

export component FeaturesPage() {
	<head>
		<title>{'TSRX | Features'}</title>
		<meta
			name="description"
			content="TSRX language features: components, statement-based JSX, control flow, error boundaries, and more."
		/>
	</head>

	<div class="app-shell">
		<div class="page-shell">
			<header class="masthead">
				<a class="brand-lockup" href="/" aria-label="TSRX home">
					<img class="header-logo" src="/images/tsrx-mark.svg?v=4" alt="TSRX logo" />
				</a>
				<nav class="masthead-nav">
					<a href="/getting-started">{'Getting Started'}</a>
					<a href="/features" aria-current="page">{'Features'}</a>
					<a href="/specification">{'Specification'}</a>
					<a href="/playground">{'Playground'}</a>
					<a href="https://discord.gg/HCYpT5QHQR" target="_blank" rel="noopener noreferrer">
						{'Discord'}
					</a>
					<a
						href="https://github.com/Ripple-TS/ripple/tree/main/packages/tsrx"
						target="_blank"
						rel="noopener noreferrer"
					>
						{'GitHub'}
					</a>
					<a href="/llms.txt" target="_blank" rel="noopener noreferrer">{'llms.txt'}</a>
				</nav>
			</header>

			<div class="docs-layout">
				<aside class="side-nav">
					<label class="side-nav-dropdown">
						<span class="side-nav-dropdown-label">{'Jump to section'}</span>
						<select
							class="side-nav-select"
							onChange={(event) => {
								const select = event.currentTarget as HTMLSelectElement;
								if (typeof window !== 'undefined' && select.value) {
									window.location.hash = select.value;
								}
							}}
						>
							<option value="">{'Jump to section'}</option>
							for (const item of NAV_ITEMS) {
								<option value={item.id}>{item.label}</option>
							}
						</select>
					</label>
					<nav>
						<p class="side-nav-heading">{'Features'}</p>
						for (const item of NAV_ITEMS) {
							<a class="side-nav-link" href={`#${item.id}`}>{item.label}</a>
						}
					</nav>
				</aside>

				<main class="docs-content">
					<section class="doc-section" id="components">
						<h2 class="section-heading">{'Components'}</h2>
						<p class="section-body">
							{'TSRX introduces the '}
							<code class="inline-code">{'component'}</code>
							{' keyword. Components are declared like functions but use '}
							<code class="inline-code">{'component'}</code>
							{' instead of '}
							<code class="inline-code">{'function'}</code>
							{'. Props are typed with a single parameter, and templates live directly in the component body — alongside logic, event handlers, and scoped styles.'}
						</p>
						<pre class="code-block">
							<code>{html COMPONENT_HTML}</code>
						</pre>
						<p class="section-body">
							{'Components are exported with '}
							<code class="inline-code">{'export component'}</code>
							{' the same way you\'d export a function. The compiler transforms them into standard framework components for whichever target you\'re using.'}
						</p>
						<p class="section-body">
							{'Since JSX in TSRX is statement-based (see '}
							<a href="#jsx">{'Statement-based JSX'}</a>
							{'), anything that needs richer control flow or imperative logic can simply live in a plain inline function. Declare a '}
							<code class="inline-code">{'const fn = () => { ... }'}</code>
							{' next to your template, write whatever JS/TS you like inside it, and call it from an event handler or expression — it stays ordinary JavaScript, unaffected by the component body\'s template rules.'}
						</p>
						<pre class="code-block">
							<code>{html BAILOUT_HTML}</code>
						</pre>
					</section>

					<section class="doc-section" id="jsx">
						<h2 class="section-heading">{'Statement-based JSX'}</h2>
						<p class="section-body">
							{'In TSRX, JSX elements are statements — they appear directly in the component body rather than being expressions you assign or return. Static text can be written as direct double-quoted children, while dynamic values and JavaScript expressions still use '}
							<code class="inline-code">{'{}'}</code>
							{'.'}
						</p>
						<pre class="code-block">
							<code>{html STATEMENT_HTML}</code>
						</pre>
						<p class="section-body">
							{'This means you can\'t assign JSX to a variable or return it from a function by default. When you need JSX as a value — to assign it, pass it as a prop, or return it from a helper — wrap it in '}
							<code class="inline-code">{'<>...</>'}</code>
							{' or the explicit '}
							<code class="inline-code">{'<tsx></tsx>'}</code>
							{':'}
						</p>
						<pre class="code-block">
							<code>{html TSX_EXPR_HTML}</code>
						</pre>
					</section>

					<section class="doc-section" id="text-expressions">
						<h2 class="section-heading">{'Text expressions'}</h2>
						<p class="section-body">
							{'Because JSX is statement-based, unquoted bare text can\'t sit directly inside an element the way it does in React. Static text may be written as a direct double-quoted child. JavaScript string literals, template literals, variables, function calls, ternaries, and other dynamic values live inside expression containers '}
							<code class="inline-code">{'{ ... }'}</code>
							{'.'}
						</p>
						<pre class="code-block">
							<code>{html TEXT_EXPR_HTML}</code>
						</pre>
						<p class="section-body">
							{'Adjacent '}
							<code class="inline-code">{'{ ... }'}</code>
							{' containers concatenate with adjacent double-quoted text when rendered, so you can mix static strings with dynamic values without extra wrapping elements. Expressions are re-evaluated whenever their dependencies change, so dynamic text updates automatically on reactive targets like Ripple and Solid.'}
						</p>
						<p class="section-body">
							{'A bare '}
							<code class="inline-code">{'{ expr }'}</code>
							{' is polymorphic — the compiler picks the right output based on where it sits and what the expression evaluates to. For the rare case where you need to force text handling, TSRX reserves a '}
							<code class="inline-code">{'text'}</code>
							{' keyword that can appear as the first token inside a container:'}
						</p>
						<p class="section-body">
							<strong>{'{text expr}'}</strong>
							{' — forces the value to render as an escaped text node. The expression is coerced to a string and any HTML-special characters ('}
							<code class="inline-code">{'<'}</code>
							{', '}
							<code class="inline-code">{'>'}</code>
							{', '}
							<code class="inline-code">{'&'}</code>
							{') are escaped. Use this when the surrounding context could otherwise be ambiguous — for example when the expression might resolve to a JSX fragment, or when you want to guarantee text handling for untrusted input.'}
						</p>
						<pre class="code-block">
							<code>{html TEXT_KW_HTML}</code>
						</pre>
						<p class="section-body muted">
							{'Omitting '}
							<code class="inline-code">{'text'}</code>
							{' is almost always what you want; reach for it only when you specifically need the escaping guarantee.'}
						</p>
					</section>

					<section class="doc-section" id="raw-html">
						<h2 class="section-heading">{'Raw HTML'}</h2>
						<p class="section-body">
							<strong>{'Ripple fully supports this; Vue supports a narrower subset. '}</strong>
							{'The '}
							<code class="inline-code">{'{html expr}'}</code>
							{' container is an escape hatch for inserting pre-rendered markup directly into the DOM, similar in spirit to Svelte\'s '}
							<code class="inline-code">{'{@html ...}'}</code>
							{'. The expression must evaluate to a string, and it replaces the surrounding element\'s contents as parsed HTML rather than escaped text.'}
						</p>
						<pre class="code-block">
							<code>{html HTML_KW_HTML}</code>
						</pre>
						<p class="section-body">
							{'Only one '}
							<code class="inline-code">{'{html ...}'}</code>
							{' may sit inside an element, and it can\'t share the element with sibling children. Like '}
							<code class="inline-code">{'text'}</code>
							{', the '}
							<code class="inline-code">{'html'}</code>
							{' keyword is compile-time only and disappears after the transform — in Ripple it lowers to an internal '}
							<code class="inline-code">{'_$_.html'}</code>
							{' binding.'}
						</p>
						<p class="section-body">
							{'React, Preact, and Solid do not have a cleanly-matching child-level primitive, so compiling '}
							<code class="inline-code">{'{html ...}'}</code>
							{' with '}
							<code class="inline-code">{'@tsrx/react'}</code>
							{', '}
							<code class="inline-code">{'@tsrx/preact'}</code>
							{', or '}
							<code class="inline-code">{'@tsrx/solid'}</code>
							{' is a compile-time error. Vue accepts it only when it is the sole child of a host element, where it lowers to '}
							<code class="inline-code">{'innerHTML={markup}'}</code>
							{'; composite elements and sibling children are rejected. For the other non-Ripple targets, reach for the attribute-level equivalent directly: '}
							<code class="inline-code">{'dangerouslySetInnerHTML={{ __html: markup }}'}</code>
							{' on React and Preact, or '}
							<code class="inline-code">{'innerHTML={markup}'}</code>
							{' on Solid.'}
						</p>
						<p class="section-body muted">
							<strong>{'Security: '}</strong>
							{'only use '}
							<code class="inline-code">{'{html ...}'}</code>
							{' with content you trust. Any string that originated from user input must be sanitised first — otherwise you\'re opening an XSS vector. If in doubt, stick with the default '}
							<code class="inline-code">{'{ ... }'}</code>
							{' container or '}
							<code class="inline-code">{'{text ...}'}</code>
							{'.'}
						</p>
					</section>

					<section class="doc-section" id="lazy-destructuring">
						<h2 class="section-heading">{'Lazy destructuring'}</h2>
						<p class="section-body">
							{'TSRX adds two sigils — '}
							<code class="inline-code">{'&{ ... }'}</code>
							{' for objects and '}
							<code class="inline-code">{'&[ ... ]'}</code>
							{' for arrays — that look like destructuring but defer the actual property access until each binding is read. Every reference to a lazy binding is compiled back to a property lookup on the source object, so downstream readers pick up the latest value without a manual getter.'}
						</p>
						<p class="section-body">
							{'The most common use is in component parameters. Regular object destructuring would snapshot each prop at call time and break any target runtime that relies on per-access reactivity (Ripple, Solid). '}
							{'The most common use is in component parameters. Regular object destructuring would snapshot each prop at call time and break any target runtime that relies on per-access reactivity (Ripple, Solid, Vue). '}
							<code class="inline-code">{'&{ ... }'}</code>
							{' preserves that reactivity while keeping the ergonomic destructuring syntax:'}
						</p>
						<pre class="code-block">
							<code>{html LAZY_PROPS_HTML}</code>
						</pre>
						<p class="section-body muted">
							{'Lazy destructuring is supported across every target. In React and Preact it compiles to direct property access on the source object; in Ripple, Solid, and Vue it preserves tracked, signal, or proxy-backed reactivity without needing a wrapper call.'}
						</p>
					</section>

					<section class="doc-section" id="prop-shorthands">
						<h2 class="section-heading">{'Prop shorthands'}</h2>
						<p class="section-body">
							{'When a prop name matches the variable you\'re passing, you can use the shorthand '}
							<code class="inline-code">{'{name}'}</code>
							{' instead of '}
							<code class="inline-code">{'name={name}'}</code>
							{'. This works for any attribute or prop — including event handlers like '}
							<code class="inline-code">{'{onClick}'}</code>
							{'.'}
						</p>
						<pre class="code-block">
							<code>{html SHORTHAND_HTML}</code>
						</pre>
					</section>

					<section class="doc-section" id="refs">
						<h2 class="section-heading">{'DOM refs'}</h2>
						<p class="section-body">
							{'TSRX has two ref syntaxes. The keyword form '}
							<code class="inline-code">{'{ref expr}'}</code>
							{' is the canonical TSRX ref and works on every target — multiple keyword refs may sit on the same element and the compiler merges them. The TSX-style attribute form '}
							<code class="inline-code">{'ref={refObject}'}</code>
							{' targets the runtime\'s native ref-object primitive and is accepted on every target except Ripple; at most one per element.'}
						</p>
						<pre class="code-block">
							<code>{html REFS_HTML}</code>
						</pre>
						<p class="section-body">
							{'What '}
							<code class="inline-code">{'expr'}</code>
							{' can be and how it\'s interpreted depends on the target. Callback refs work on every target; mutable-variable assignment sugar ('}
							<code class="inline-code">{'let var; <el {ref var} />'}</code>
							{') works on Solid and Ripple. React, Preact, and Vue need a callback or the target\'s ref-object primitive instead. Reactive primitives are a Ripple/Solid specialty. Ripple accepts a '}
							<code class="inline-code">{'Tracked'}</code>
							{' from '}
							<code class="inline-code">{'track()'}</code>
							{' and Solid accepts a signal setter.'}
						</p>
						<table class="ref-target-table">
							<thead>
								<tr>
									<th>{'Target'}</th>
									<th>{'Callback '}</th>
									<th>{'Mutable Local'}</th>
									<th>{'Reactive primitive'}</th>
									<th>{'TSX ref={...}'}</th>
								</tr>
							</thead>
							<tbody>
								<tr>
									<td>{'React'}</td>
									<td>{'✓'}</td>
									<td>{'—'}</td>
									<td>{'—'}</td>
									<td>{'✓'}</td>
								</tr>
								<tr>
									<td>{'Preact'}</td>
									<td>{'✓'}</td>
									<td>{'—'}</td>
									<td>{'—'}</td>
									<td>{'✓'}</td>
								</tr>
								<tr>
									<td>{'Solid'}</td>
									<td>{'✓'}</td>
									<td>{'✓'}</td>
									<td>{'✓'}</td>
									<td>{'✓'}</td>
								</tr>
								<tr>
									<td>{'Vue'}</td>
									<td>{'✓'}</td>
									<td>{'—'}</td>
									<td>{'—'}</td>
									<td>{'✓'}</td>
								</tr>
								<tr>
									<td>{'Ripple'}</td>
									<td>{'✓'}</td>
									<td>{'✓'}</td>
									<td>{'✓'}</td>
									<td>{'—'}</td>
								</tr>
							</tbody>
						</table>
						<pre class="code-block">
							<code>{html REFS_TRACKED_HTML}</code>
						</pre>
						<p class="section-body">
							{'You can combine at most one '}
							<code class="inline-code">{'ref={...}'}</code>
							{' attribute with any number of '}
							<code class="inline-code">{'{ref ...}'}</code>
							{' on the same element. The compiler folds them into one ref that fires every callback and assigns every ref object on mount.'}
						</p>
						<pre class="code-block">
							<code>{html REFS_OBJECT_HTML}</code>
						</pre>
						<p class="section-body">
							{'Composite refs work on React, Preact, Solid, and Ripple. The child receives the ref as a regular prop and applies it to a DOM element — typically by spreading '}
							<code class="inline-code">{'{...props}'}</code>
							{', which lets the target framework wire the ref through automatically. Use a callback or the target\'s ref-object primitive for cross-boundary capture; plain '}
							<code class="inline-code">{'let'}</code>
							{' variables only work on host elements (the assignment-sugar setter needs direct lexical access to the slot). Vue is different: component refs resolve to component instances rather than the rendered DOM node, so the Vue target currently supports '}
							<code class="inline-code">{'{ref ...}'}</code>
							{' only on host elements.'}
						</p>
						<pre class="code-block">
							<code>{html REFS_COMPOSITE_HTML}</code>
						</pre>
						<p class="section-body muted">
							{'Multi-ref runtime: React, Preact, and Vue share a '}
							<code class="inline-code">{'mergeRefs'}</code>
							{' helper (imported from '}
							<code class="inline-code">{'@tsrx/<target>/merge-refs'}</code>
							{') that handles function refs, '}
							<code class="inline-code">{'.current'}</code>
							{' ref objects, '}
							<code class="inline-code">{'.value'}</code>
							{' ref objects, and React 19 cleanup return values uniformly. Solid emits an array literal '}
							<code class="inline-code">{'ref={[a, b]}'}</code>
							{' — its ref runtime iterates arrays natively. Ripple uses a per-ref '}
							<code class="inline-code">{'Symbol'}</code>
							{' key so refs survive '}
							<code class="inline-code">{'{...rest}'}</code>
							{' spreading without colliding with user-named props.'}
						</p>
					</section>

					<section class="doc-section" id="scoping">
						<h2 class="section-heading">{'Lexical scoping'}</h2>
						<p class="section-body">
							{'Every nested element and component body creates its own lexical scope. You can declare variables, compute derived values, or call functions inside an element\'s children — they\'re scoped to that block and won\'t leak into the surrounding component.'}
						</p>
						<pre class="code-block">
							<code>{html SCOPING_HTML}</code>
						</pre>
						<p class="section-body">
							{'This applies to all block-like contexts: element children, component children, and control flow branches ('}
							<code class="inline-code">{'if'}</code>
							{', '}
							<code class="inline-code">{'for'}</code>
							{', '}
							<code class="inline-code">{'switch'}</code>
							{', '}
							<code class="inline-code">{'try'}</code>
							{'). Each one has its own scope.'}
						</p>
					</section>

					<section class="doc-section" id="children">
						<h2 class="section-heading">{'Children'}</h2>
						<p class="section-body">
							{'Composite components accept children as nested JSX — just like HTML elements. However, children must be JSX statements, not expressions. You can\'t pass an array, function, or other value as children between the opening and closing tags.'}
						</p>
						<p class="section-body">
							{'When you need to pass a computed value, use the '}
							<code class="inline-code">{'children'}</code>
							{' prop explicitly instead:'}
						</p>
						<pre class="code-block">
							<code>{html CHILDREN_HTML}</code>
						</pre>
						<p class="section-body">
							<strong>{'Render props: '}</strong>
							{'Render props are just function-valued props in TSRX. Pass them explicitly as '}
							<code class="inline-code">{'children={...}'}</code>
							{' or a named prop like '}
							<code class="inline-code">{'render={...}'}</code>
							{'. If that function returns JSX, wrap the JSX in '}
							<code class="inline-code">{'<>...</>'}</code>
							{' or '}
							<code class="inline-code">{'<tsx>...</tsx>'}</code>
							{' because JSX is statement-based by default.'}
						</p>
						<pre class="code-block">
							<code>{html RENDER_PROPS_HTML}</code>
						</pre>
					</section>

					<section class="doc-section" id="if">
						<h2 class="section-heading">{'Conditional rendering'}</h2>
						<p class="section-body">
							{'Use standard '}
							<code class="inline-code">{'if'}</code>
							{' / '}
							<code class="inline-code">{'else if'}</code>
							{' / '}
							<code class="inline-code">{'else'}</code>
							{' statements directly inside templates. No ternaries or wrapper components needed.'}
						</p>
						<pre class="code-block">
							<code>{html IF_HTML}</code>
						</pre>
					</section>

					<section class="doc-section" id="for">
						<h2 class="section-heading">{'List rendering'}</h2>
						<p class="section-body">
							{'Render lists with '}
							<code class="inline-code">{'for...of'}</code>
							{' loops. TSRX extends the syntax with optional '}
							<code class="inline-code">{'index'}</code>
							{' and '}
							<code class="inline-code">{'key'}</code>
							{' clauses so you don\'t need separate counters or key-extraction boilerplate.'}
						</p>
						<pre class="code-block">
							<code>{html FOR_HTML}</code>
						</pre>
					</section>

					<section class="doc-section" id="switch">
						<h2 class="section-heading">{'Switch statements'}</h2>
						<p class="section-body">
							{'Multi-branch rendering uses a standard '}
							<code class="inline-code">{'switch'}</code>
							{' statement. Each case can contain JSX elements and ends with '}
							<code class="inline-code">{'break'}</code>
							{'.'}
						</p>
						<pre class="code-block">
							<code>{html SWITCH_HTML}</code>
						</pre>
					</section>

					<section class="doc-section" id="try">
						<h2 class="section-heading">{'Error boundaries'}</h2>
						<p class="section-body">
							{'Wrap components in '}
							<code class="inline-code">{'try'}</code>
							{' / '}
							<code class="inline-code">{'catch'}</code>
							{' to create error boundaries. If a child component throws, the catch block renders fallback UI.'}
						</p>
						<pre class="code-block">
							<code>{html TRY_HTML}</code>
						</pre>
					</section>

					<section class="doc-section" id="async-boundaries">
						<h2 class="section-heading">{'Async boundaries'}</h2>
						<p class="section-body">
							{'Wrap a component subtree in '}
							<code class="inline-code">{'try'}</code>
							{' / '}
							<code class="inline-code">{'pending'}</code>
							{' / '}
							<code class="inline-code">{'catch'}</code>
							{' to handle async children. While a lazy child or resource is in flight, the '}
							<code class="inline-code">{'pending'}</code>
							{' branch renders; when it resolves, the '}
							<code class="inline-code">{'try'}</code>
							{' body takes over; if it rejects — or any child throws synchronously — '}
							<code class="inline-code">{'catch'}</code>
							{' runs. Both '}
							<code class="inline-code">{'pending'}</code>
							{' and '}
							<code class="inline-code">{'catch'}</code>
							{' are optional and can be used independently.'}
						</p>
						<p class="section-body">
							{'Async work itself is expressed using the target\'s own lazy-loading primitive — '}
							<code class="inline-code">{'lazy()'}</code>
							{' from '}
							<code class="inline-code">{'react'}</code>
							{', '}
							<code class="inline-code">{'preact/compat'}</code>
							{', or '}
							<code class="inline-code">{'solid-js'}</code>
							{', and the Ripple equivalent on the Ripple target. In Solid and Ripple targets, component bodies are synchronous and do not allow inline '}
							<code class="inline-code">{'await'}</code>
							{'. On React and Preact, top-level component-body '}
							<code class="inline-code">{'await'}</code>
							{' is supported and TSRX emits an async component function.'}
						</p>
						<p class="section-body muted">
							{'React/Preact note: '}
							<code class="inline-code">{'for await...of'}</code>
							{' is not supported inside component templates. Use an upstream async helper and render the resolved data.'}
						</p>
						<pre class="code-block">
							<code>{html ASYNC_BOUNDARY_HTML}</code>
						</pre>
					</section>

					<section class="doc-section" id="scoped-styles">
						<h2 class="section-heading">{'Scoped styles'}</h2>
						<p class="section-body">
							{'Each component can include a '}
							<code class="inline-code">{'<style>'}</code>
							{' block. Styles are automatically scoped — the compiler rewrites selectors with a unique hash so they only apply to elements inside the component that defines them. A parent\'s scoped styles will not leak into child components.'}
						</p>
						<pre class="code-block">
							<code>{html SCOPED_STYLES_HTML}</code>
						</pre>
						<p class="section-body">
							{'To escape scoping and apply styles globally, wrap a selector in '}
							<code class="inline-code">{':global()'}</code>
							{'. This lets you reach into child components or target elements outside the current scope.'}
						</p>
					</section>

					<section class="doc-section" id="style-composition">
						<h2 class="section-heading">{'Style composition'}</h2>
						<p class="section-body">
							{'Because scoped styles don\'t cross component boundaries, TSRX provides '}
							<code class="inline-code">{'{style "className"}'}</code>
							{' for passing scoped class names to child components as props. '}
							<code class="inline-code">{'{style "highlight"}'}</code>
							{' produces a string containing both the scope hash and the class name, which the child applies via its '}
							<code class="inline-code">{'class'}</code>
							{' attribute.'}
						</p>
						<pre class="code-block">
							<code>{html STYLE_COMPOSITION_HTML}</code>
						</pre>
						<p class="section-body">
							{'The class referenced via '}
							<code class="inline-code">{'{style}'}</code>
							{' must exist as a standalone selector in the component\'s '}
							<code class="inline-code">{'<style>'}</code>
							{' block. Classes that only appear in compound or descendant selectors cannot be passed.'}
						</p>
					</section>

					<section class="doc-section" id="early-return">
						<h2 class="section-heading">{'Early returns'}</h2>
						<p class="section-body">
							{'Guard clauses use a bare '}
							<code class="inline-code">{'return;'}</code>
							{' with no value. Everything before the return is rendered; everything after is skipped. This replaces the pattern of returning early from a render function.'}
						</p>
						<pre class="code-block">
							<code>{html RETURN_HTML}</code>
						</pre>
						<p class="section-body muted">
							{'Note: '}
							<code class="inline-code">{'return;'}</code>
							{' is a guard exit only — '}
							<code class="inline-code">{'return <JSX />'}</code>
							{' and '}
							<code class="inline-code">{'return value'}</code>
							{' are not valid in component bodies.'}
						</p>
					</section>
					<section class="doc-section" id="react-hooks">
						<h2 class="section-heading">{'React & Preact Hooks'}</h2>
						<p class="section-body">
							{'When targeting React with '}
							<code class="inline-code">{'@tsrx/react'}</code>
							{' or Preact with '}
							<code class="inline-code">{'@tsrx/preact'}</code>
							{', the compiler lifts all hook calls to the top of the generated function — regardless of where they appear in the TSRX source. That means hooks can appear after early returns, inside conditional blocks, or even inside loops, and the compiled output still satisfies the Rules of Hooks.'}
						</p>
						<p class="section-body">
							{'Both targets also support top-level component-body '}
							<code class="inline-code">{'await'}</code>
							{' and TSRX will emit an async component function when it appears in the component body.'}
						</p>
						<pre class="code-block">
							<code>{html REACT_HOOKS_HTML}</code>
						</pre>
					</section>
				</main>
			</div>

			<footer class="site-footer">
				<p>{'Released under the MIT License.'}</p>
				<p>{'Copyright © 2025-present Dominic Gannaway'}</p>
			</footer>
		</div>
	</div>

	<style>
		:global(*) {
			box-sizing: border-box;
		}

		:global(html) {
			scroll-behavior: smooth;
			overflow-x: clip;
			scrollbar-gutter: stable;
		}

		:global(body) {
			margin: 0;
			font-family:
				system-ui,
				-apple-system,
				BlinkMacSystemFont,
				'Segoe UI',
				Roboto,
				sans-serif;
			color: #1a1640;
			background:
				radial-gradient(circle at top, rgba(146, 92, 255, 0.14), transparent 15%),
				radial-gradient(circle at 80% 10%, rgba(111, 0, 255, 0.1), transparent 15%),
				linear-gradient(180deg, #ffffff 0%, #f6f3ff 46%, #f2f4fb 100%);
			background-repeat: no-repeat;
			background-size:
				100% 100vh,
				100% 100vh,
				100% 100%;
			min-height: 100vh;
			overflow-x: clip;
		}

		:global(a) {
			color: inherit;
			text-decoration: none;
		}

		:global(code),
		:global(pre) {
			font-family: 'Spline Sans Mono', 'SFMono-Regular', monospace;
		}

		.app-shell {
			position: relative;
			z-index: 1;
			width: 100%;
		}

		.page-shell {
			width: min(1180px, calc(100vw - 2rem));
			margin: 0 auto;
			padding: 1rem 0 4rem;
		}

		.masthead {
			display: flex;
			justify-content: space-between;
			align-items: center;
			gap: 1rem;
			padding: 1rem 0 2rem;
			flex-wrap: wrap;
		}

		.brand-lockup {
			display: inline-flex;
			align-items: center;
		}

		.header-logo {
			display: block;
			width: 3.2rem;
			height: 3.2rem;
		}

		.masthead-nav {
			display: inline-flex;
			gap: 1rem;
			font-size: 0.95rem;
			color: rgba(26, 22, 64, 0.7);
		}

		.masthead-nav a {
			white-space: nowrap;
		}

		.masthead-nav a:hover {
			color: #5e2cff;
		}

		.masthead-nav a[aria-current='page'] {
			color: #5e2cff;
			font-weight: 500;
		}

		/* --- Docs layout with side nav --- */

		.docs-layout {
			display: grid;
			grid-template-columns: 200px 1fr;
			gap: 3rem;
			align-items: start;
		}

		.side-nav {
			position: sticky;
			top: 1.5rem;
			padding-top: 0.5rem;
		}

		.side-nav-dropdown {
			display: none;
		}

		.side-nav-dropdown-label {
			display: block;
			margin: 0 0 0.45rem;
			font-size: 0.72rem;
			font-weight: 600;
			text-transform: uppercase;
			letter-spacing: 0.06em;
			color: rgba(26, 22, 64, 0.45);
		}

		.side-nav-select {
			width: 100%;
			padding: 0.75rem 3rem 0.75rem 1.2rem;
			border: 1px solid rgba(94, 44, 255, 0.12);
			border-radius: 0.9rem;
			background-color: rgba(255, 255, 255, 0.92);
			color: #1a1640;
			appearance: none;
			-webkit-appearance: none;
			-moz-appearance: none;
			background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='none'%3E%3Cpath d='M6 8l4 4 4-4' stroke='%231a1640' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
			background-repeat: no-repeat;
			background-size: 0.95rem;
			background-position: right 1.2rem center;
		}

		.side-nav-heading {
			margin: 0 0 0.75rem;
			font-size: 0.78rem;
			font-weight: 600;
			text-transform: uppercase;
			letter-spacing: 0.06em;
			color: rgba(26, 22, 64, 0.45);
		}

		.side-nav-link {
			display: block;
			padding: 0.3rem 0;
			font-size: 0.9rem;
			color: rgba(26, 22, 64, 0.6);
			transition: color 0.15s;
		}

		.side-nav-link:hover {
			color: #5e2cff;
		}

		/* --- Content sections --- */

		.docs-content {
			min-width: 0;
		}

		.doc-section {
			margin-top: 3rem;
		}

		.doc-section:first-child {
			margin-top: 0.5rem;
		}

		.section-heading {
			margin: 0 0 0.75rem;
			font-size: clamp(1.5rem, 3vw, 2rem);
			line-height: 1.1;
			letter-spacing: -0.03em;
		}

		.section-body {
			margin: 0.5rem 0 0;
			font-size: 1.05rem;
			line-height: 1.7;
			color: rgba(26, 22, 64, 0.76);
		}

		.section-body.muted {
			color: rgba(26, 22, 64, 0.55);
			font-style: italic;
		}

		.inline-code {
			background: rgba(94, 44, 255, 0.1);
			color: #5e2cff;
			padding: 0.12em 0.4em;
			border-radius: 4px;
			font-size: 0.92em;
		}

		.ref-target-table {
			margin: 1rem 0 0;
			width: 100%;
			border-collapse: collapse;
			font-size: 0.95rem;
			color: rgba(26, 22, 64, 0.85);
			border: 1px solid rgba(94, 44, 255, 0.18);
			border-radius: 6px;
			overflow: hidden;
		}

		.ref-target-table th,
		.ref-target-table td {
			padding: 0.55rem 0.75rem;
			text-align: left;
			border-bottom: 1px solid rgba(94, 44, 255, 0.12);
			vertical-align: top;
		}

		.ref-target-table thead th {
			background: rgba(94, 44, 255, 0.06);
			font-weight: 600;
			color: #1a1640;
			border-bottom: 1px solid rgba(94, 44, 255, 0.2);
		}

		.ref-target-table tbody tr:last-child td {
			border-bottom: none;
		}

		.ref-target-table tbody td:first-child {
			font-weight: 600;
			color: #1a1640;
		}

		.ref-target-table .inline-code {
			font-size: 0.85em;
		}

		.code-block {
			margin: 0.75rem 0 0;
			padding: 1.25rem 1.4rem;
			overflow-x: auto;
			background: #0e1528;
			color: #e7ecff;
			font-size: 0.88rem;
			line-height: 1.65;
			white-space: pre;
			-webkit-font-smoothing: antialiased;
		}

		:global(.code-block .ln) {
			color: rgba(255, 255, 255, 0.25);
			display: inline-block;
			width: 1.4rem;
			text-align: right;
			margin-right: 0.85rem;
			user-select: none;
		}

		:global(.code-block .kw) {
			color: #569cd6;
		}
		:global(.code-block .kw-export) {
			color: #c586c0;
		}
		:global(.code-block .kw-ctrl) {
			color: #c586c0;
		}
		:global(.code-block .fn) {
			color: #dcdcaa;
		}
		:global(.code-block .type) {
			color: #4ec9b0;
		}
		:global(.code-block .prop) {
			color: #9cdcfe;
		}
		:global(.code-block .str) {
			color: #ce9178;
		}
		:global(.code-block .val) {
			color: #b5cea8;
		}
		:global(.code-block .el) {
			color: #569cd6;
		}
		:global(.code-block .tag) {
			color: #808080;
		}
		:global(.code-block .attr) {
			color: #92c5f8;
		}
		:global(.code-block .br) {
			color: #ffd700;
		}
		:global(.code-block .tbr) {
			color: #ffd700;
		}
		:global(.code-block .css-sel) {
			color: #d7ba7d;
		}
		:global(.code-block .css-br) {
			color: #d4d4d4;
		}
		:global(.code-block .cmt) {
			color: #6a9955;
		}

		.site-footer {
			margin-top: 4rem;
			padding: 2rem 0;
			border-top: 1px solid rgba(26, 22, 64, 0.1);
			text-align: center;
		}

		.site-footer p {
			margin: 0;
			font-size: 0.88rem;
			line-height: 1.6;
			color: rgba(26, 22, 64, 0.5);
		}

		@media (max-width: 720px) {
			.page-shell {
				width: calc(100vw - 1.5rem);
				padding: 0.5rem 0 2rem;
			}

			.masthead {
				padding: 0.75rem 0 1rem;
				align-items: flex-start;
				gap: 0.85rem;
			}

			.brand-lockup {
				width: 100%;
				justify-content: center;
			}

			.masthead-nav {
				display: flex;
				width: 100%;
				flex-wrap: wrap;
				justify-content: center;
				gap: 0.5rem;
				font-size: 0.82rem;
			}

			.masthead-nav a {
				display: inline-flex;
				align-items: center;
				min-height: 2rem;
				padding: 0.35rem 0.7rem;
				border: 1px solid rgba(94, 44, 255, 0.1);
				border-radius: 999px;
				background: rgba(94, 44, 255, 0.06);
				line-height: 1.1;
			}

			.masthead-nav a[aria-current='page'] {
				background: rgba(94, 44, 255, 0.12);
				border-color: rgba(94, 44, 255, 0.18);
			}

			.header-logo {
				width: 3.6rem;
				height: 3.6rem;
			}

			.docs-layout {
				display: block;
			}

			.side-nav {
				position: sticky;
				top: 0;
				z-index: 5;
				padding: 0.6rem 0;
				border-bottom: 1px solid rgba(26, 22, 64, 0.1);
				margin-bottom: 1rem;
			}

			.side-nav-dropdown {
				display: block;
			}

			.side-nav nav {
				display: none;
			}

			.side-nav-dropdown-label {
				margin-bottom: 0.35rem;
			}

			.side-nav-select {
				font-size: 0.95rem;
			}

			.doc-section {
				margin-top: 2rem;
			}

			.section-heading {
				font-size: clamp(1.3rem, 5vw, 1.65rem);
			}

			.section-body {
				font-size: 0.95rem;
			}

			.code-block {
				padding: 1rem 0.75rem;
				font-size: 0.75rem;
				line-height: 1.55;
			}

			.site-footer {
				margin-top: 2rem;
				padding: 1.5rem 0;
			}
		}
	</style>
}
