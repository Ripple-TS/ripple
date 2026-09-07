import { useState, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';

// TodoMVC fixture (React 19) — same DOM contract as the sibling apps (see
// ../../README.md). One adaptation shared with the js-framework react column:
// state updates are wrapped in `flushSync` so React commits SYNCHRONOUSLY
// inside the dispatched event — the harness times only the synchronous
// interaction window (octane/ripple flush on the discrete event, solid calls
// flush()), so without this React would report ~0ms of scheduling instead of
// the render. The `.new-todo`/`.edit` inputs are uncontrolled (handlers read
// e.target.value), matching every sibling.

let nextId = 1;

function allocateTodoId() {
	return nextId++;
}

function TodoApp() {
	const [todos, setTodos] = useState([]);
	const [filter, setFilter] = useState('all');
	const [editing, setEditing] = useState(null);

	const addTodo = useCallback((e) => {
		if (e.key !== 'Enter') return;
		const input = e.target;
		const title = input.value.trim();
		if (title === '') return;
		flushSync(() => setTodos((t) => [...t, { id: allocateTodoId(), title, completed: false }]));
		input.value = '';
	}, []);
	const toggle = (id) =>
		flushSync(() =>
			setTodos((t) => t.map((x) => (x.id === id ? { ...x, completed: !x.completed } : x))),
		);
	const destroy = (id) => flushSync(() => setTodos((t) => t.filter((x) => x.id !== id)));
	const toggleAll = (e) => {
		const on = e.target.checked;
		flushSync(() =>
			setTodos((t) => t.map((x) => (x.completed === on ? x : { ...x, completed: on }))),
		);
	};
	const clearCompleted = useCallback(
		() => flushSync(() => setTodos((t) => t.filter((x) => !x.completed))),
		[],
	);
	const startEdit = (id) => flushSync(() => setEditing(id));
	const commitEdit = (id, e) => {
		const title = e.target.value.trim();
		flushSync(() => {
			if (title === '') setTodos((t) => t.filter((x) => x.id !== id));
			else setTodos((t) => t.map((x) => (x.id === id ? { ...x, title } : x)));
			setEditing(null);
		});
	};
	const editKeyDown = (id, e) => {
		if (e.key === 'Enter') commitEdit(id, e);
		else if (e.key === 'Escape') flushSync(() => setEditing(null));
	};

	const visible =
		filter === 'active'
			? todos.filter((t) => !t.completed)
			: filter === 'completed'
				? todos.filter((t) => t.completed)
				: todos;
	const remaining = todos.filter((t) => !t.completed).length;
	const anyCompleted = todos.length - remaining > 0;

	return (
		<section className="todoapp">
			<header className="header">
				<h1>todos</h1>
				<input className="new-todo" placeholder="What needs to be done?" onKeyDown={addTodo} />
			</header>
			{todos.length > 0 && (
				<>
					<section className="main">
						<input
							id="toggle-all"
							className="toggle-all"
							type="checkbox"
							checked={remaining === 0}
							onChange={toggleAll}
						/>
						<ul className="todo-list">
							{visible.map((t) => (
								<li
									key={t.id}
									className={
										(t.completed ? 'completed' : '') + (editing === t.id ? ' editing' : '')
									}
								>
									<div className="view">
										<input
											className="toggle"
											type="checkbox"
											checked={t.completed}
											onChange={() => toggle(t.id)}
										/>
										<label onDoubleClick={() => startEdit(t.id)}>{t.title}</label>
										<button className="destroy" onClick={() => destroy(t.id)}></button>
									</div>
									{editing === t.id && (
										<input
											className="edit"
											defaultValue={t.title}
											onKeyDown={(e) => editKeyDown(t.id, e)}
											onBlur={(e) => commitEdit(t.id, e)}
										/>
									)}
								</li>
							))}
						</ul>
					</section>
					<footer className="footer">
						<span className="todo-count">
							<strong>{remaining}</strong>
							{remaining === 1 ? ' item left' : ' items left'}
						</span>
						<ul className="filters">
							<li>
								<a
									className={filter === 'all' ? 'selected' : ''}
									data-filter="all"
									onClick={() => flushSync(() => setFilter('all'))}
								>
									All
								</a>
							</li>
							<li>
								<a
									className={filter === 'active' ? 'selected' : ''}
									data-filter="active"
									onClick={() => flushSync(() => setFilter('active'))}
								>
									Active
								</a>
							</li>
							<li>
								<a
									className={filter === 'completed' ? 'selected' : ''}
									data-filter="completed"
									onClick={() => flushSync(() => setFilter('completed'))}
								>
									Completed
								</a>
							</li>
						</ul>
						{anyCompleted && (
							<button className="clear-completed" onClick={clearCompleted}>
								Clear completed
							</button>
						)}
					</footer>
				</>
			)}
		</section>
	);
}

createRoot(document.getElementById('main')).render(<TodoApp />);
