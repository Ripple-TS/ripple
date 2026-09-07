<script>
	import { flushSync } from 'svelte';

	// Runes-mode TodoMVC. The todo graph is replaced wholesale, so $state.raw
	// avoids deep proxy work while keyed each blocks retain surviving rows.
	let nextId = 1;
	let todos = $state.raw([]);
	let filter = $state('all');
	let editing = $state(null);

	let visible = $derived(
		filter === 'active'
			? todos.filter((todo) => !todo.completed)
			: filter === 'completed'
				? todos.filter((todo) => todo.completed)
				: todos,
	);
	let remaining = $derived(todos.filter((todo) => !todo.completed).length);
	let anyCompleted = $derived(todos.length - remaining > 0);

	function addTodo(event) {
		if (event.key !== 'Enter') return;
		const input = event.currentTarget;
		const title = input.value.trim();
		if (title === '') return;
		flushSync(() => {
			todos = [...todos, { id: nextId++, title, completed: false }];
		});
		input.value = '';
	}
	function toggle(id) {
		flushSync(() => {
			todos = todos.map((todo) =>
				todo.id === id ? { ...todo, completed: !todo.completed } : todo,
			);
		});
	}
	function destroy(id) {
		flushSync(() => {
			todos = todos.filter((todo) => todo.id !== id);
		});
	}
	function toggleAll(event) {
		const completed = event.currentTarget.checked;
		flushSync(() => {
			todos = todos.map((todo) => (todo.completed === completed ? todo : { ...todo, completed }));
		});
	}
	function clearCompleted() {
		flushSync(() => {
			todos = todos.filter((todo) => !todo.completed);
		});
	}
	function startEdit(id) {
		flushSync(() => {
			editing = id;
		});
	}
	function commitEdit(id, event) {
		const title = event.currentTarget.value.trim();
		flushSync(() => {
			todos =
				title === ''
					? todos.filter((todo) => todo.id !== id)
					: todos.map((todo) => (todo.id === id ? { ...todo, title } : todo));
			editing = null;
		});
	}
	function editKeyDown(id, event) {
		if (event.key === 'Enter') commitEdit(id, event);
		else if (event.key === 'Escape') {
			flushSync(() => {
				editing = null;
			});
		}
	}
	function selectFilter(next) {
		flushSync(() => {
			filter = next;
		});
	}
</script>

<section class="todoapp">
	<header class="header">
		<h1>todos</h1>
		<input class="new-todo" placeholder="What needs to be done?" onkeydown={addTodo} />
	</header>
	{#if todos.length > 0}
		<section class="main">
			<input
				id="toggle-all"
				class="toggle-all"
				type="checkbox"
				checked={remaining === 0}
				onclick={toggleAll}
			/>
			<ul class="todo-list">
				{#each visible as todo (todo.id)}
					<li class={(todo.completed ? 'completed' : '') + (editing === todo.id ? ' editing' : '')}>
						<div class="view">
							<input
								class="toggle"
								type="checkbox"
								checked={todo.completed}
								onclick={() => toggle(todo.id)}
							/>
							<!-- svelte-ignore a11y_label_has_associated_control -->
							<label ondblclick={() => startEdit(todo.id)}>{todo.title}</label>
							<!-- svelte-ignore a11y_consider_explicit_label -->
							<button class="destroy" onclick={() => destroy(todo.id)}></button>
						</div>
						{#if editing === todo.id}
							<input
								class="edit"
								value={todo.title}
								onkeydown={(event) => editKeyDown(todo.id, event)}
								onblur={(event) => commitEdit(todo.id, event)}
							/>
						{/if}
					</li>
				{/each}
			</ul>
		</section>
		<footer class="footer">
			<span class="todo-count">
				<strong>{remaining}</strong>{remaining === 1 ? ' item left' : ' items left'}
			</span>
			<ul class="filters">
				<li>
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<!-- svelte-ignore a11y_missing_attribute -->
					<a class:selected={filter === 'all'} data-filter="all" onclick={() => selectFilter('all')}
						>All</a
					>
				</li>
				<li>
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<!-- svelte-ignore a11y_missing_attribute -->
					<a
						class:selected={filter === 'active'}
						data-filter="active"
						onclick={() => selectFilter('active')}>Active</a
					>
				</li>
				<li>
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<!-- svelte-ignore a11y_missing_attribute -->
					<a
						class:selected={filter === 'completed'}
						data-filter="completed"
						onclick={() => selectFilter('completed')}>Completed</a
					>
				</li>
			</ul>
			{#if anyCompleted}
				<button class="clear-completed" onclick={clearCompleted}>Clear completed</button>
			{/if}
		</footer>
	{/if}
</section>
