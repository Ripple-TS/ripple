import { track, flushSync } from 'ripple';

// TodoMVC fixture (Ripple) — same DOM contract as the sibling apps (see
// ../../README.md). Authored idiomatically for ripple's current syntax
// (`function … @{}`, `let &[x] = track(…)` reactive bindings, keyed `@for`,
// `@if`), with immutable list updates. Every handler wraps its mutation in
// `flushSync` so the commit lands inside the harness's timed, synchronous
// interaction window (ripple otherwise batches + flushes on a microtask) —
// the same adaptation as the js-framework ripple column.

interface Todo {
	id: number;
	title: string;
	completed: boolean;
}

let nextId = 1;

export default function TodoApp() @{
	let &[todos] = track<Todo[]>([]);
	let &[filter] = track<'all' | 'active' | 'completed'>('all');
	let &[editing] = track<number | null>(null);

	const addTodo = (e: KeyboardEvent) => {
		if (e.key !== 'Enter') return;
		const input = e.target as HTMLInputElement;
		const title = input.value.trim();
		if (title === '') return;
		flushSync(() => {
			todos = [...todos, { id: nextId++, title, completed: false }];
		});
		input.value = '';
	};
	const toggle = (id: number) => flushSync(() => {
		todos = todos.map((x) => (x.id === id ? { ...x, completed: !x.completed } : x));
	});
	const destroy = (id: number) => flushSync(() => {
		todos = todos.filter((x) => x.id !== id);
	});
	const toggleAll = (e: Event) => {
		const on = (e.target as HTMLInputElement).checked;
		flushSync(() => {
			todos = todos.map((x) => (x.completed === on ? x : { ...x, completed: on }));
		});
	};
	const clearCompleted = () => flushSync(() => {
		todos = todos.filter((x) => !x.completed);
	});
	const startEdit = (id: number) => flushSync(() => {
		editing = id;
	});
	const commitEdit = (id: number, e: Event) => {
		const title = (e.target as HTMLInputElement).value.trim();
		flushSync(() => {
			if (title === '') {
				todos = todos.filter((x) => x.id !== id);
			} else {
				todos = todos.map((x) => (x.id === id ? { ...x, title } : x));
			}
			editing = null;
		});
	};
	const editKeyDown = (id: number, e: KeyboardEvent) => {
		if (e.key === 'Enter') commitEdit(id, e);
		else if (e.key === 'Escape') flushSync(() => {
			editing = null;
		});
	};

	// Ripple is fine-grained: the body runs ONCE, so deriveds must be
	// FUNCTIONS evaluated inside template expressions (the tracked reads then
	// register with the reactive expression), never setup-time consts.
	const visible = () => filter === 'active'
		? todos.filter((t) => !t.completed)
		: filter === 'completed'
			? todos.filter((t) => t.completed)
			: todos;
	const remaining = () => todos.filter((t) => !t.completed).length;
	const anyCompleted = () => todos.some((t) => t.completed);

	<section class="todoapp">
		<header class="header">
			<h1>{'todos'}</h1>
			<input class="new-todo" placeholder="What needs to be done?" onKeyDown={addTodo} />
		</header>
		@if (todos.length > 0) {
			<>
				<section class="main">
					<input
						id="toggle-all"
						class="toggle-all"
						type="checkbox"
						checked={remaining() === 0}
						onClick={toggleAll}
					/>
					<ul class="todo-list">
						@for (const t of visible(); key t.id) {
							<li class={(t.completed ? 'completed' : '') + (editing === t.id ? ' editing' : '')}>
								<div class="view">
									<input
										class="toggle"
										type="checkbox"
										checked={t.completed}
										onClick={() => toggle(t.id)}
									/>
									<label onDblClick={() => startEdit(t.id)}>{t.title}</label>
									<button class="destroy" onClick={() => destroy(t.id)} />
								</div>
								@if (editing === t.id) {
									<input
										class="edit"
										value={t.title}
										onKeyDown={(e: KeyboardEvent) => editKeyDown(t.id, e)}
										onBlur={(e: Event) => commitEdit(t.id, e)}
									/>
								}
							</li>
						}
					</ul>
				</section>
				<footer class="footer">
					<span class="todo-count">
						<strong>{remaining()}</strong>
						{remaining() === 1 ? ' item left' : ' items left'}
					</span>
					<ul class="filters">
						<li>
							<a
								class={filter === 'all' ? 'selected' : ''}
								data-filter="all"
								onClick={() => flushSync(() => {
									filter = 'all';
								})}
							>{'All'}</a>
						</li>
						<li>
							<a
								class={filter === 'active' ? 'selected' : ''}
								data-filter="active"
								onClick={() => flushSync(() => {
									filter = 'active';
								})}
							>{'Active'}</a>
						</li>
						<li>
							<a
								class={filter === 'completed' ? 'selected' : ''}
								data-filter="completed"
								onClick={() => flushSync(() => {
									filter = 'completed';
								})}
							>{'Completed'}</a>
						</li>
					</ul>
					@if (anyCompleted()) {
						<button class="clear-completed" onClick={clearCompleted}>{'Clear completed'}</button>
					}
				</footer>
			</>
		}
	</section>
}
