import { For, createStore, reconcile } from 'solid-js';
import { bindSetter } from '../../shared/bridge.js';
import { INITIAL_SNAPSHOT } from '../../shared/workloads.js';

function TableView(props) {
	return (
		<table class="uibench-table" data-kind="table">
			<tbody>
				<For each={props.rows}>
					{(row) => (
						<tr data-id={row.id} class={row.active ? 'active' : 'inactive'}>
							<th>{row.label}</th>
							<For each={row.cells}>{(cell) => <td>{cell.text}</td>}</For>
						</tr>
					)}
				</For>
			</tbody>
		</table>
	);
}

function AnimView(props) {
	return (
		<div class="uibench-anim" data-kind="anim">
			<For each={props.boxes}>
				{(box) => <div class="box" data-id={box.id} style={{ transform: box.transform }} />}
			</For>
		</div>
	);
}

function TreeItem(props) {
	return (
		<li data-id={props.node.id} class={props.node.children.length === 0 ? 'leaf' : 'container'}>
			<span>{props.node.label}</span>
			{props.node.children.length > 0 ? (
				<ul>
					<For each={props.node.children}>{(child) => <TreeItem node={child} />}</For>
				</ul>
			) : null}
		</li>
	);
}

function TreeView(props) {
	return (
		<ul class="uibench-tree" data-kind="tree">
			<For each={props.nodes}>{(node) => <TreeItem node={node} />}</For>
		</ul>
	);
}

export default function App() {
	const [snapshot, setSnapshot] = createStore({
		kind: INITIAL_SNAPSHOT.kind,
		rows: INITIAL_SNAPSHOT.rows,
		boxes: [],
		nodes: [],
	});

	bindSetter((next) =>
		setSnapshot((current) => {
			current.kind = next.kind;
			if (next.kind === 'table') reconcile(next.rows, 'id')(current.rows);
			else if (next.kind === 'anim') reconcile(next.boxes, 'id')(current.boxes);
			else reconcile(next.nodes, 'id')(current.nodes);
		}),
	);

	return (
		<>
			{snapshot.kind === 'table' ? (
				<TableView rows={snapshot.rows} />
			) : snapshot.kind === 'anim' ? (
				<AnimView boxes={snapshot.boxes} />
			) : (
				<TreeView nodes={snapshot.nodes} />
			)}
		</>
	);
}
