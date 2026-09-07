import { createSignal, For, Show, flush } from 'solid-js';
import { render } from '@solidjs/web';

// TodoMVC fixture (Solid 2.0) — same DOM contract as the sibling apps (see
// ../../README.md). Authored idiomatically: a `createSignal` of plain todo
// objects with immutable updates (the shape of Solid's own TodoMVC demo),
// keyed `<For>` over the filtered view, fine-grained class/checked bindings.
// Solid 2.0-beta batches and flushes on a microtask, so every handler calls
// `flush()` after its set — the commit lands inside the harness's timed,
// synchronous interaction window (same adaptation as the js-framework column).

let nextId = 1;

function TodoApp() {
	const [todos, setTodos] = createSignal([]);
	const [filter, setFilter] = createSignal('all');
	const [editing, setEditing] = createSignal(null);

	const addTodo = (e) => {
		if (e.key !== 'Enter') return;
		const input = e.target;
		const title = input.value.trim();
		if (title === '') return;
		setTodos((t) => [...t, { id: nextId++, title, completed: false }]);
		flush();
		input.value = '';
	};
	const toggle = (id) => {
		setTodos((t) => t.map((x) => (x.id === id ? { ...x, completed: !x.completed } : x)));
		flush();
	};
	const destroy = (id) => {
		setTodos((t) => t.filter((x) => x.id !== id));
		flush();
	};
	const toggleAll = (e) => {
		const on = e.target.checked;
		setTodos((t) => t.map((x) => (x.completed === on ? x : { ...x, completed: on })));
		flush();
	};
	const clearCompleted = () => {
		setTodos((t) => t.filter((x) => !x.completed));
		flush();
	};
	const startEdit = (id) => {
		setEditing(id);
		flush();
	};
	const commitEdit = (id, e) => {
		const title = e.target.value.trim();
		if (title === '') setTodos((t) => t.filter((x) => x.id !== id));
		else setTodos((t) => t.map((x) => (x.id === id ? { ...x, title } : x)));
		setEditing(null);
		flush();
	};
	const editKeyDown = (id, e) => {
		if (e.key === 'Enter') commitEdit(id, e);
		else if (e.key === 'Escape') {
			setEditing(null);
			flush();
		}
	};

	const visible = () => {
		const f = filter();
		const t = todos();
		return f === 'active'
			? t.filter((x) => !x.completed)
			: f === 'completed'
				? t.filter((x) => x.completed)
				: t;
	};
	const remaining = () => todos().filter((t) => !t.completed).length;
	const anyCompleted = () => todos().length - remaining() > 0;

	return (
		<section class="todoapp">
			<header class="header">
				<h1>todos</h1>
				<input class="new-todo" placeholder="What needs to be done?" onKeyDown={addTodo} />
			</header>
			<Show when={todos().length > 0}>
				<section class="main">
					<input
						id="toggle-all"
						class="toggle-all"
						type="checkbox"
						checked={remaining() === 0}
						onClick={toggleAll}
					/>
					<ul class="todo-list">
						<For each={visible()}>
							{(t) => (
								<li
									class={(t.completed ? 'completed' : '') + (editing() === t.id ? ' editing' : '')}
								>
									<div class="view">
										<input
											class="toggle"
											type="checkbox"
											checked={t.completed}
											onClick={() => toggle(t.id)}
										/>
										<label onDblClick={() => startEdit(t.id)}>{t.title}</label>
										<button class="destroy" onClick={() => destroy(t.id)}></button>
									</div>
									<Show when={editing() === t.id}>
										<input
											class="edit"
											value={t.title}
											onKeyDown={(e) => editKeyDown(t.id, e)}
											onBlur={(e) => commitEdit(t.id, e)}
										/>
									</Show>
								</li>
							)}
						</For>
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
								class={filter() === 'all' ? 'selected' : ''}
								data-filter="all"
								onClick={() => {
									setFilter('all');
									flush();
								}}
							>
								All
							</a>
						</li>
						<li>
							<a
								class={filter() === 'active' ? 'selected' : ''}
								data-filter="active"
								onClick={() => {
									setFilter('active');
									flush();
								}}
							>
								Active
							</a>
						</li>
						<li>
							<a
								class={filter() === 'completed' ? 'selected' : ''}
								data-filter="completed"
								onClick={() => {
									setFilter('completed');
									flush();
								}}
							>
								Completed
							</a>
						</li>
					</ul>
					<Show when={anyCompleted()}>
						<button class="clear-completed" onClick={clearCompleted}>
							Clear completed
						</button>
					</Show>
				</footer>
			</Show>
		</section>
	);
}

render(() => <TodoApp />, document.getElementById('main'));
