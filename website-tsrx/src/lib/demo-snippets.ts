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
		source: `export function FeatureCard({
  title,
  items,
  ready,
}: {
  title: string;
  items: string[];
  ready: boolean;
}) @{
  <>
    <section class="feature-card">
      <h2>{title}</h2>

      @if (ready) {
        <ul>
          @for (const item of items; index index) {
            <li>{item}</li>
          }
        </ul>
      } @else {
        <p>Loading output...</p>
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
  </>
}`,
	},
	{
		value: 'components',
		label: 'Components + style',
		source: `export function Button({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) @{
  <>
    <button class="btn" {onClick}>{label}</button>

    <style>
      .btn {
        padding: 0.5rem 1rem;
        border-radius: 4px;
      }
    </style>
  </>
}`,
	},
	{
		value: 'conditional-rendering',
		label: 'Conditional rendering',
		targets: ['react', 'preact', 'ripple', 'solid', 'vue'],
		source: `function StatusBadge({ status }: { status: 'active' | 'idle' | 'offline' }) @{
  @if (status === 'active') {
    <span class="badge active">Online</span>
  } @else if (status === 'idle') {
    <span class="badge idle">Away</span>
  } @else {
    <span class="badge">Offline</span>
  }
}`,
	},
	{
		value: 'list-rendering',
		label: 'List rendering',
		targets: ['react', 'preact', 'ripple', 'solid', 'vue'],
		source: `function TodoList({ items }: { items: { text: string }[] }) @{
  <ul>
    @for (const item of items; index i) {
      <li>{i + 1}. {item.text}</li>
    }
  </ul>
}`,
	},
	{
		value: 'switch-statements',
		label: 'Switch statements',
		targets: ['react', 'preact', 'ripple', 'solid', 'vue'],
		source: `function StatusMessage({ status }: { status: string }) @{
  @switch (status) {
    @case 'loading': {
      <p>Loading...</p>
    }
    @case 'success': {
      <p class="success">Done!</p>
    }
    @default: {
      <p>Unknown status.</p>
    }
  }
}`,
	},
	{
		value: 'error-boundary',
		label: 'Error boundary',
		targets: ['react', 'preact', 'ripple', 'solid', 'vue'],
		source: `function SafeProfile({ userId }: { userId: string }) @{
  @try {
    <UserProfile id={userId} />
  } @catch (error) {
    <div class="error">
      <p>Something went wrong.</p>
    </div>
  }
}`,
	},
	{
		value: 'async-boundary',
		label: 'Async boundary',
		targets: ['react', 'preact', 'ripple', 'solid', 'vue'],
		source: `import { AsyncProfile } from './profile.tsrx';

export function App() @{
  @try {
    <AsyncProfile />
  } @pending {
    <p class="pending">Loading profile...</p>
  }
}`,
	},
	{
		value: 'async-boundary-error',
		label: 'Async + Error boundary',
		targets: ['react', 'preact', 'ripple', 'solid', 'vue'],
		source: `import { AsyncProfile } from './profile.tsrx';

export function App() @{
  @try {
    <AsyncProfile />
  } @pending {
    <p class="pending">Loading profile...</p>
  } @catch (error) {
    <p class="error">{(error as Error).message}</p>
  }
}`,
	},
	{
		value: 'scoped-styles',
		label: 'Scoped styles',
		source: `function Card() @{
  <>
    <div class="card">
      <h2>Scoped title</h2>
      <p>Styles here do not leak out.</p>
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
  </>
}`,
	},
	{
		value: 'vue-starter',
		label: 'Vue starter',
		targets: ['vue'],
		source: `import { ref } from 'vue';

function App() @{
  const count = ref(0);

  <main>
    <h1>Hello from TSRX Vue</h1>
    <p>This is a minimal Vue-compatible TSRX snippet.</p>
    <button onClick={() => count.value++}>Count: {count.value}</button>
  </main>
}

export default App;`,
	},
];
