<script setup vapor>
// TodoMVC fixture (Vue Vapor 3.6) — same DOM contract as the sibling apps
// (see ../../README.md). Authored idiomatically: a shallowRef todo array with
// immutable replacement (the filters/count derive via computed), keyed v-for,
// @keydown.enter handlers on uncontrolled inputs. Vue flushes on a microtask
// with no public sync flush, so ./main.js exposes `window.__benchFlush` and
// the harness awaits it inside each timed interaction window (the same
// protocol as the js-framework vue-vapor column).
import { ref, shallowRef, computed } from 'vue';

let nextId = 1;

const todos = shallowRef([]);
const filter = ref('all');
const editing = ref(null);

function addTodo(e) {
	const title = e.target.value.trim();
	if (title === '') return;
	todos.value = [...todos.value, { id: nextId++, title, completed: false }];
	e.target.value = '';
}
function toggle(id) {
	todos.value = todos.value.map((x) => (x.id === id ? { ...x, completed: !x.completed } : x));
}
function destroy(id) {
	todos.value = todos.value.filter((x) => x.id !== id);
}
function toggleAll(e) {
	const on = e.target.checked;
	todos.value = todos.value.map((x) => (x.completed === on ? x : { ...x, completed: on }));
}
function clearCompleted() {
	todos.value = todos.value.filter((x) => !x.completed);
}
function startEdit(id) {
	editing.value = id;
}
function commitEdit(id, e) {
	const title = e.target.value.trim();
	if (title === '') todos.value = todos.value.filter((x) => x.id !== id);
	else todos.value = todos.value.map((x) => (x.id === id ? { ...x, title } : x));
	editing.value = null;
}
function editKeyDown(id, e) {
	if (e.key === 'Enter') commitEdit(id, e);
	else if (e.key === 'Escape') editing.value = null;
}

const visible = computed(() => {
	const t = todos.value;
	return filter.value === 'active'
		? t.filter((x) => !x.completed)
		: filter.value === 'completed'
			? t.filter((x) => x.completed)
			: t;
});
const remaining = computed(() => todos.value.filter((t) => !t.completed).length);
const anyCompleted = computed(() => todos.value.length - remaining.value > 0);
</script>

<template>
	<section class="todoapp">
		<header class="header">
			<h1>todos</h1>
			<input class="new-todo" placeholder="What needs to be done?" @keydown.enter="addTodo" />
		</header>
		<template v-if="todos.length > 0">
			<section class="main">
				<input
					id="toggle-all"
					class="toggle-all"
					type="checkbox"
					:checked="remaining === 0"
					@click="toggleAll"
				/>
				<ul class="todo-list">
					<li
						v-for="t of visible"
						:key="t.id"
						:class="{ completed: t.completed, editing: editing === t.id }"
					>
						<div class="view">
							<input class="toggle" type="checkbox" :checked="t.completed" @click="toggle(t.id)" />
							<label @dblclick="startEdit(t.id)">{{ t.title }}</label>
							<button class="destroy" @click="destroy(t.id)"></button>
						</div>
						<input
							v-if="editing === t.id"
							class="edit"
							:value="t.title"
							@keydown="editKeyDown(t.id, $event)"
							@blur="commitEdit(t.id, $event)"
						/>
					</li>
				</ul>
			</section>
			<footer class="footer">
				<span class="todo-count">
					<strong>{{ remaining }}</strong
					>{{ remaining === 1 ? ' item left' : ' items left' }}
				</span>
				<ul class="filters">
					<li>
						<a :class="{ selected: filter === 'all' }" data-filter="all" @click="filter = 'all'"
							>All</a
						>
					</li>
					<li>
						<a
							:class="{ selected: filter === 'active' }"
							data-filter="active"
							@click="filter = 'active'"
							>Active</a
						>
					</li>
					<li>
						<a
							:class="{ selected: filter === 'completed' }"
							data-filter="completed"
							@click="filter = 'completed'"
							>Completed</a
						>
					</li>
				</ul>
				<button v-if="anyCompleted" class="clear-completed" @click="clearCompleted">
					Clear completed
				</button>
			</footer>
		</template>
	</section>
</template>
