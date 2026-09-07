import { useState } from 'octane';

// TodoMVC fixture (octane .tsrx) — the canonical app-shaped benchmark. All
// five sibling apps implement the SAME DOM contract (see ../../README.md):
// `.new-todo` input (Enter adds, uncontrolled — the handler reads
// e.target.value), `.toggle-all`, per-item `.toggle`/`.destroy`, dblclick a
// label to edit (`.edit` input: Enter commits, Escape cancels, blur commits),
// `.filters a[data-filter]`, `.todo-count strong`, `.clear-completed`. The
// harness (../../run.mjs) drives Speedometer-style scripted interactions
// (add-100, toggle-all, complete-25, filter cycle, edit-10, clear, destroy-25)
// and verifies the DOM after every op. Deterministic: no PRNG, no storage, no
// routing — filters are plain state.
//
// Authored idiomatically: immutable list updates through the useState setter,
// per-row `onClick={() => toggle(t.id)}` arrows (the compiler's event-bundle
// shape), keyed `@for`, and clsx-style `class={{ completed: … }}` objects.

interface Todo {
	id: number;
	title: string;
	completed: boolean;
}

let nextId = 1;

export function TodoApp() @{
	const [todos, setTodos] = useState<Todo[]>([]);
	const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
	const [editing, setEditing] = useState<number | null>(null);

	const addTodo = (e: KeyboardEvent) => {
		if (e.key !== 'Enter') return;
		const input = e.target as HTMLInputElement;
		const title = input.value.trim();
		if (title === '') return;
		setTodos((t) => [...t, { id: nextId++, title, completed: false }]);
		input.value = '';
	};
	const toggle = (id: number) => setTodos(
		(t) => t.map((x) => (x.id === id ? { ...x, completed: !x.completed } : x)),
	);
	const destroy = (id: number) => setTodos((t) => t.filter((x) => x.id !== id));
	const toggleAll = (e: Event) => {
		const on = (e.target as HTMLInputElement).checked;
		setTodos((t) => t.map((x) => (x.completed === on ? x : { ...x, completed: on })));
	};
	const clearCompleted = () => setTodos((t) => t.filter((x) => !x.completed));
	const startEdit = (id: number) => setEditing(id);
	const commitEdit = (id: number, e: Event) => {
		const title = (e.target as HTMLInputElement).value.trim();
		if (title === '') setTodos((t) => t.filter((x) => x.id !== id));
		else setTodos((t) => t.map((x) => (x.id === id ? { ...x, title } : x)));
		setEditing(null);
	};
	const editKeyDown = (id: number, e: KeyboardEvent) => {
		if (e.key === 'Enter') commitEdit(id, e);
		else if (e.key === 'Escape') setEditing(null);
	};

	const visible =
		filter === 'active'
			? todos.filter((t) => !t.completed)
			: filter === 'completed'
				? todos.filter((t) => t.completed)
				: todos;
	const remaining = todos.filter((t) => !t.completed).length;
	const anyCompleted = todos.length - remaining > 0;

	<section class="todoapp">
		<header class="header">
			<h1>todos</h1>
			<input class="new-todo" placeholder="What needs to be done?" onKeyDown={addTodo} />
		</header>
		@if (todos.length > 0) {
			<>
				<section class="main">
					<input
						id="toggle-all"
						class="toggle-all"
						type="checkbox"
						checked={remaining === 0}
						onClick={toggleAll}
					/>
					<ul class="todo-list">
						@for (const t of visible; key t.id) {
							<li class={{ completed: t.completed, editing: editing === t.id }}>
								<div class="view">
									<input
										class="toggle"
										type="checkbox"
										checked={t.completed}
										onClick={() => toggle(t.id)}
									/>
									<label onDoubleClick={() => startEdit(t.id)}>{t.title as string}</label>
									<button class="destroy" onClick={() => destroy(t.id)}></button>
								</div>
								@if (editing === t.id) {
									<input
										class="edit"
										defaultValue={t.title}
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
						<strong>{'' + remaining}</strong>
						{remaining === 1 ? ' item left' : ' items left'}
					</span>
					<ul class="filters">
						<li>
							<a
								class={{ selected: filter === 'all' }}
								data-filter="all"
								onClick={() => setFilter('all')}
							>
								All
							</a>
						</li>
						<li>
							<a
								class={{ selected: filter === 'active' }}
								data-filter="active"
								onClick={() => setFilter('active')}
							>
								Active
							</a>
						</li>
						<li>
							<a
								class={{ selected: filter === 'completed' }}
								data-filter="completed"
								onClick={() => setFilter('completed')}
							>
								Completed
							</a>
						</li>
					</ul>
					@if (anyCompleted) {
						<button class="clear-completed" onClick={clearCompleted}>Clear completed</button>
					}
				</footer>
			</>
		}
	</section>
}
