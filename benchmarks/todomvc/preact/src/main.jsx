import { render } from 'preact';
import { useCallback, useState } from 'preact/hooks';

// Preact queues hook updates in a microtask. The harness awaits this after each
// interaction so native scheduling and the DOM commit stay timed.
window.__benchFlush = () => Promise.resolve();

let nextId = 1;

function TodoApp() {
	const [todos, setTodos] = useState([]);
	const [filter, setFilter] = useState('all');
	const [editing, setEditing] = useState(null);

	const addTodo = useCallback((e) => {
		if (e.key !== 'Enter') return;
		const input = e.currentTarget;
		const title = input.value.trim();
		if (title === '') return;
		setTodos((items) => [...items, { id: nextId++, title, completed: false }]);
		input.value = '';
	}, []);
	const toggle = (id) =>
		setTodos((items) =>
			items.map((item) => (item.id === id ? { ...item, completed: !item.completed } : item)),
		);
	const destroy = (id) => setTodos((items) => items.filter((item) => item.id !== id));
	const toggleAll = (e) => {
		const completed = e.currentTarget.checked;
		setTodos((items) =>
			items.map((item) => (item.completed === completed ? item : { ...item, completed })),
		);
	};
	const clearCompleted = useCallback(
		() => setTodos((items) => items.filter((item) => !item.completed)),
		[],
	);
	const startEdit = (id) => setEditing(id);
	const commitEdit = (id, e) => {
		const title = e.currentTarget.value.trim();
		setTodos((items) =>
			title === ''
				? items.filter((item) => item.id !== id)
				: items.map((item) => (item.id === id ? { ...item, title } : item)),
		);
		setEditing(null);
	};
	const editKeyDown = (id, e) => {
		if (e.key === 'Enter') commitEdit(id, e);
		else if (e.key === 'Escape') setEditing(null);
	};

	const visible =
		filter === 'active'
			? todos.filter((todo) => !todo.completed)
			: filter === 'completed'
				? todos.filter((todo) => todo.completed)
				: todos;
	const remaining = todos.filter((todo) => !todo.completed).length;
	const anyCompleted = todos.length - remaining > 0;

	return (
		<section class="todoapp">
			<header class="header">
				<h1>todos</h1>
				<input class="new-todo" placeholder="What needs to be done?" onKeyDown={addTodo} />
			</header>
			{todos.length > 0 && (
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
							{visible.map((todo) => (
								<li
									key={todo.id}
									class={
										(todo.completed ? 'completed' : '') + (editing === todo.id ? ' editing' : '')
									}
								>
									<div class="view">
										<input
											class="toggle"
											type="checkbox"
											checked={todo.completed}
											onClick={() => toggle(todo.id)}
										/>
										<label onDblClick={() => startEdit(todo.id)}>{todo.title}</label>
										<button class="destroy" onClick={() => destroy(todo.id)}></button>
									</div>
									{editing === todo.id && (
										<input
											class="edit"
											defaultValue={todo.title}
											onKeyDown={(e) => editKeyDown(todo.id, e)}
											onBlur={(e) => commitEdit(todo.id, e)}
										/>
									)}
								</li>
							))}
						</ul>
					</section>
					<footer class="footer">
						<span class="todo-count">
							<strong>{remaining}</strong>
							{remaining === 1 ? ' item left' : ' items left'}
						</span>
						<ul class="filters">
							{['all', 'active', 'completed'].map((name) => (
								<li key={name}>
									<a
										class={filter === name ? 'selected' : ''}
										data-filter={name}
										onClick={() => setFilter(name)}
									>
										{name[0].toUpperCase() + name.slice(1)}
									</a>
								</li>
							))}
						</ul>
						{anyCompleted && (
							<button class="clear-completed" onClick={clearCompleted}>
								Clear completed
							</button>
						)}
					</footer>
				</>
			)}
		</section>
	);
}

render(<TodoApp />, document.getElementById('main'));
