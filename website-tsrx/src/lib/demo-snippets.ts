export type DemoSnippet = {
	value: string;
	label: string;
	source: string;
	targets?: string[];
};

export const DEMO_SNIPPETS: DemoSnippet[] = [
	{
		value: 'feature-card',
		label: 'Feature card',
		targets: ['react', 'preact', 'ripple', 'solid', 'vue'],
		source: `export component FeatureCard({
  title,
  items,
  ready,
}: {
  title: string;
  items: string[];
  ready: boolean;
}) {
  <section class="feature-card">
    <h2>{title}</h2>

    if (ready) {
      <ul>
        for (const item of items; index index) {
          <li>{item}</li>
        }
      </ul>
    } else {
      <p>"Loading output..."</p>
    }
  </section>

  <style>
    .feature-card {
      padding: 1rem;
      border: 1px solid rgba(90, 108, 255, 0.2);
      background: rgba(255, 255, 255, 0.78);
    }

    .feature-card h2 {
      margin: 0 0 0.75rem;
      font-size: 1.15rem;
    }

    .feature-card ul {
      margin: 0;
      padding-left: 1.1rem;
    }
  </style>
}`,
	},
	{
		value: 'components',
		label: 'Components + style',
		source: `export component Button({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  <button class="btn" {onClick}>{label}</button>

  <style>
    .btn {
      padding: 0.5rem 1rem;
      border-radius: 4px;
    }
  </style>
}`,
	},
	{
		value: 'statement-jsx',
		label: 'Statement-based JSX',
		source: `component Greeting() {
  <h1>"Hello World"</h1>
  <p>"Welcome to TSRX."</p>
}`,
	},
	{
		value: 'conditional-rendering',
		label: 'Conditional rendering',
		targets: ['react', 'preact', 'ripple', 'solid', 'vue'],
		source: `component StatusBadge({ status }: { status: 'active' | 'idle' | 'offline' }) {
  <div>
    if (status === 'active') {
      <span class="badge active">"Online"</span>
    } else if (status === 'idle') {
      <span class="badge idle">"Away"</span>
    } else {
      <span class="badge">"Offline"</span>
    }
  </div>
}`,
	},
	{
		value: 'list-rendering',
		label: 'List rendering',
		targets: ['react', 'preact', 'ripple', 'solid', 'vue'],
		source: `component TodoList({ items }: { items: { text: string }[] }) {
  <ul>
    for (const item of items; index i) {
      <li>{i + 1}". "{item.text}</li>
    }
  </ul>
}`,
	},
	{
		value: 'switch-statements',
		label: 'Switch statements',
		targets: ['react', 'preact', 'ripple', 'solid', 'vue'],
		source: `component StatusMessage({ status }: { status: string }) {
  switch (status) {
    case 'loading':
      <p>"Loading..."</p>
      break;
    case 'success':
      <p class="success">"Done!"</p>
      break;
    default:
      <p>"Unknown status."</p>
  }
}`,
	},
	{
		value: 'error-boundary',
		label: 'Try/catch boundary',
		targets: ['react', 'preact', 'ripple', 'solid', 'vue'],
		source: `component SafeProfile({ userId }: { userId: string }) {
  try {
    <UserProfile id={userId} />
  } catch (error) {
    <div class="error">
      <p>"Something went wrong."</p>
    </div>
  }
}`,
	},
	{
		value: 'scoped-styles',
		label: 'Scoped styles',
		source: `component Card() {
  <div class="card">
    <h2>"Scoped title"</h2>
    <p>"Styles here do not leak out."</p>
  </div>

  <style>
    .card {
      padding: 1.5rem;
      border: 1px solid #ddd;
    }

    h2 {
      color: #333;
    }
  </style>
}`,
	},
	{
		value: 'vue-starter',
		label: 'Vue starter',
		targets: ['vue'],
		source: `import { ref } from 'vue';

export default component App() {
  const count = ref(0);

  <main>
    <h1>{'Hello from TSRX Vue'}</h1>
    <p>{'This is a minimal Vue-compatible TSRX snippet.'}</p>
    <button onClick={() => count.value++}>{'Count: '}{count.value}</button>
  </main>
}`,
	},
	{
		value: 'nested-react-hooks',
		label: 'Nested React Hooks',
		targets: ['react'],
		source: `import { useEffect, useState } from 'react';

export component App() {
  const [tab, setTab] = useState('overview');
  const posts = [
    { title: 'Compiler update' },
    { title: 'Runtime notes' },
    { title: 'Hydration deep dive' },
  ];

  <h1>"Nested React Hooks"</h1>
  <button onClick={() => setTab(tab === 'overview' ? 'recent' : 'overview')}>
    {tab}
  </button>

  <ul>
    for (const post of posts) {
      useEffect(() => {
        console.log('viewed ' + post.title);
      }, [post.title]);

      <li>{post.title}</li>
    }
  </ul>
}`,
	},
	{
		value: 'nested-preact-hooks',
		label: 'Nested Preact Hooks',
		targets: ['preact'],
		source: `import { useEffect, useState } from 'preact/hooks';

export component App() {
  const [tab, setTab] = useState('overview');
  const posts = [
    { title: 'Compiler update' },
    { title: 'Runtime notes' },
    { title: 'Hydration deep dive' },
  ];

  <h1>"Nested Preact Hooks"</h1>
  <button onClick={() => setTab(tab === 'overview' ? 'recent' : 'overview')}>
    {tab}
  </button>

  <ul>
    for (const post of posts) {
      useEffect(() => {
        console.log('viewed ' + post.title);
      }, [post.title]);

      <li>{post.title}</li>
    }
  </ul>
}`,
	},
];
