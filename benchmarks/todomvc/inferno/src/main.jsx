import { Component, render } from 'inferno';

// Native Inferno TodoMVC fixture with the shared DOM and interaction contract.
// Class setState commits synchronously in each timed native event.

let nextId = 1;

function allocateTodoId() {
	return nextId++;
}

class TodoApp extends Component {
	constructor(props) {
		super(props);
		this.state = { todos: [], filter: 'all', editing: null };
	}

	addTodo = (e) => {
		if (e.key !== 'Enter') return;
		const input = e.target;
		const title = input.value.trim();
		if (title === '') return;
		this.setState(({ todos }) => ({
			todos: [...todos, { id: allocateTodoId(), title, completed: false }],
		}));
		input.value = '';
	};

	toggle = (id) =>
		this.setState(({ todos }) => ({
			todos: todos.map((todo) => (todo.id === id ? { ...todo, completed: !todo.completed } : todo)),
		}));

	destroy = (id) =>
		this.setState(({ todos }) => ({ todos: todos.filter((todo) => todo.id !== id) }));

	toggleAll = (e) => {
		const on = e.target.checked;
		this.setState(({ todos }) => ({
			todos: todos.map((todo) => (todo.completed === on ? todo : { ...todo, completed: on })),
		}));
	};

	clearCompleted = () =>
		this.setState(({ todos }) => ({ todos: todos.filter((todo) => !todo.completed) }));

	startEdit = (id) => this.setState({ editing: id });

	commitEdit = (id, e) => {
		const title = e.target.value.trim();
		this.setState(({ todos }) => ({
			editing: null,
			todos:
				title === ''
					? todos.filter((todo) => todo.id !== id)
					: todos.map((todo) => (todo.id === id ? { ...todo, title } : todo)),
		}));
	};

	editKeyDown = (id, e) => {
		if (e.key === 'Enter') this.commitEdit(id, e);
		else if (e.key === 'Escape') this.setState({ editing: null });
	};

	render() {
		const { todos, filter, editing } = this.state;
		const visible =
			filter === 'active'
				? todos.filter((t) => !t.completed)
				: filter === 'completed'
					? todos.filter((t) => t.completed)
					: todos;
		const remaining = todos.filter((todo) => !todo.completed).length;
		const anyCompleted = todos.length - remaining > 0;

		return (
			<section className="todoapp">
				<header className="header">
					<h1>todos</h1>
					<input
						className="new-todo"
						placeholder="What needs to be done?"
						onKeyDown={this.addTodo}
					/>
				</header>
				{todos.length > 0 && (
					<>
						<section className="main">
							<input
								id="toggle-all"
								className="toggle-all"
								type="checkbox"
								checked={remaining === 0}
								onChange={this.toggleAll}
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
												onChange={() => this.toggle(t.id)}
											/>
											<label onDoubleClick={() => this.startEdit(t.id)}>{t.title}</label>
											<button className="destroy" onClick={() => this.destroy(t.id)}></button>
										</div>
										{editing === t.id && (
											<input
												className="edit"
												defaultValue={t.title}
												onKeyDown={(e) => this.editKeyDown(t.id, e)}
												onBlur={(e) => this.commitEdit(t.id, e)}
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
										onClick={() => this.setState({ filter: 'all' })}
									>
										All
									</a>
								</li>
								<li>
									<a
										className={filter === 'active' ? 'selected' : ''}
										data-filter="active"
										onClick={() => this.setState({ filter: 'active' })}
									>
										Active
									</a>
								</li>
								<li>
									<a
										className={filter === 'completed' ? 'selected' : ''}
										data-filter="completed"
										onClick={() => this.setState({ filter: 'completed' })}
									>
										Completed
									</a>
								</li>
							</ul>
							{anyCompleted && (
								<button className="clear-completed" onClick={this.clearCompleted}>
									Clear completed
								</button>
							)}
						</footer>
					</>
				)}
			</section>
		);
	}
}

render(<TodoApp />, document.getElementById('main'));
