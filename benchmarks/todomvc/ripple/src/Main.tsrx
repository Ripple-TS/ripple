import { track, flushSync } from 'ripple';

// TodoMVC fixture (Ripple) — same DOM contract as the sibling apps (see
// ../../README.md). Authored idiomatically for ripple's current syntax
// (`function … @{}`, `track(…)` state read and written via `.value`, keyed `@for`,
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
	const todos = track<Todo[]>([]);
	const filter = track<'all' | 'active' | 'completed'>('all');
	const editing = track<number | null>(null);

	const addTodo = (e: KeyboardEvent) => {
		if (e.key !== 'Enter') return;
		const input = e.target as HTMLInputElement;
		const title = input.value.trim();
		if (title === '') return;
		flushSync(() => {
			todos.value = [...todos.value, { id: nextId++, title, completed: false }];
		});
		input.value = '';
	};
	const toggle = (id: number) => flushSync(() => {
		todos.value = todos.value.map((x) => (x.id === id ? { ...x, completed: !x.completed } : x));
	});
	const destroy = (id: number) => flushSync(() => {
		todos.value = todos.value.filter((x) => x.id !== id);
	});
	const toggleAll = (e: Event) => {
		const on = (e.target as HTMLInputElement).checked;
		flushSync(() => {
			todos.value = todos.value.map((x) => (x.completed === on ? x : { ...x, completed: on }));
		});
	};
	const clearCompleted = () => flushSync(() => {
		todos.value = todos.value.filter((x) => !x.completed);
	});
	const startEdit = (id: number) => flushSync(() => {
		editing.value = id;
	});
	const commitEdit = (id: number, e: Event) => {
		const title = (e.target as HTMLInputElement).value.trim();
		flushSync(() => {
			if (title === '') {
				todos.value = todos.value.filter((x) => x.id !== id);
			} else {
				todos.value = todos.value.map((x) => (x.id === id ? { ...x, title } : x));
			}
			editing.value = null;
		});
	};
	const editKeyDown = (id: number, e: KeyboardEvent) => {
		if (e.key === 'Enter') commitEdit(id, e);
		else if (e.key === 'Escape') flushSync(() => {
			editing.value = null;
		});
	};

	// Deriveds (`track(fn)`) memoize the filtered views, like the sibling
	// apps' computeds: one pass per todos change, shared by every reader.
	const visible = track(
		() => filter.value === 'active'
			? todos.value.filter((t) => !t.completed)
			: filter.value === 'completed'
				? todos.value.filter((t) => t.completed)
				: todos.value,
	);
	const remaining = track(() => todos.value.filter((t) => !t.completed).length);
	const anyCompleted = track(() => todos.value.length - remaining.value > 0);

	<section class="todoapp">
		<header class="header">
			<h1>{'todos'}</h1>
			<input class="new-todo" placeholder="What needs to be done?" onKeyDown={addTodo} />
		</header>
		@if (todos.value.length > 0) {
			<>
				<section class="main">
					<input
						id="toggle-all"
						class="toggle-all"
						type="checkbox"
						checked={remaining.value === 0}
						onClick={toggleAll}
					/>
					<ul class="todo-list">
						@for (const t of visible.value; key t.id) {
							<li
								class={(t.completed ? 'completed' : '') +
									(editing.value === t.id ? ' editing' : '')}
							>
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
								@if (editing.value === t.id) {
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
						<strong>{remaining.value}</strong>
						{remaining.value === 1 ? ' item left' : ' items left'}
					</span>
					<ul class="filters">
						<li>
							<a
								class={filter.value === 'all' ? 'selected' : ''}
								data-filter="all"
								onClick={() => flushSync(() => {
									filter.value = 'all';
								})}
							>{'All'}</a>
						</li>
						<li>
							<a
								class={filter.value === 'active' ? 'selected' : ''}
								data-filter="active"
								onClick={() => flushSync(() => {
									filter.value = 'active';
								})}
							>{'Active'}</a>
						</li>
						<li>
							<a
								class={filter.value === 'completed' ? 'selected' : ''}
								data-filter="completed"
								onClick={() => flushSync(() => {
									filter.value = 'completed';
								})}
							>{'Completed'}</a>
						</li>
					</ul>
					@if (anyCompleted.value) {
						<button class="clear-completed" onClick={clearCompleted}>{'Clear completed'}</button>
					}
				</footer>
			</>
		}
	</section>
}
