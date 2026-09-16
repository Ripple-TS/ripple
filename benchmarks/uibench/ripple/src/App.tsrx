import { track, type Derived } from 'ripple';
import { bindSetter } from '../../shared/bridge.js';
import { INITIAL_SNAPSHOT } from '../../shared/workloads.js';

interface Cell {
	id: string;
	text: string;
}

interface TableRow {
	id: string;
	label: string;
	active: boolean;
	cells: Cell[];
}

interface AnimBox {
	id: string;
	transform: string;
}

interface TreeNode {
	id: string;
	label: string;
	children: TreeNode[];
}

type Snapshot =
	| { kind: 'table'; rows: TableRow[] }
	| { kind: 'anim'; boxes: AnimBox[] }
	| { kind: 'tree'; nodes: TreeNode[] };

function TableView(props: { rows: Derived<TableRow[]> }) @{
	<table class="uibench-table" data-kind="table">
		<tbody>
			@for (const row of props.rows.value; key row.id) {
				<tr data-id={row.id} class={row.active ? 'active' : 'inactive'}>
					<th>{row.label}</th>
					@for (const cell of row.cells; key cell.id) {
						<td>{cell.text}</td>
					}
				</tr>
			}
		</tbody>
	</table>
}

function AnimView(props: { boxes: Derived<AnimBox[]> }) @{
	<div class="uibench-anim" data-kind="anim">
		@for (const box of props.boxes.value; key box.id) {
			<div class="box" data-id={box.id} style={{ transform: box.transform }}></div>
		}
	</div>
}

function TreeItem(props: { node: TreeNode }) @{
	<li data-id={props.node.id} class={props.node.children.length === 0 ? 'leaf' : 'container'}>
		<span>{props.node.label}</span>
		@if (props.node.children.length > 0) {
			<ul>
				@for (const child of props.node.children; key child.id) {
					<TreeItem node={child} />
				}
			</ul>
		}
	</li>
}

function TreeView(props: { nodes: Derived<TreeNode[]> }) @{
	<ul class="uibench-tree" data-kind="tree">
		@for (const node of props.nodes.value; key node.id) {
			<TreeItem node={node} />
		}
	</ul>
}

export default function App() @{
	const snapshot = track<Snapshot>(INITIAL_SNAPSHOT as Snapshot);
	bindSetter((next: Snapshot) => {
		snapshot.value = next;
	});

	// A prop is a value: each view gets a derived so a new snapshot of the same
	// kind updates its keyed list in place instead of being read once. A row or
	// box replaced by the workload (a new object under the same key) flows
	// through the keyed item's tracked value to that item's render block.
	@switch (snapshot.value.kind) {
		@case 'table': {
			<TableView rows={track(() => (snapshot.value as { rows: TableRow[] }).rows)} />
		}
		@case 'anim': {
			<AnimView boxes={track(() => (snapshot.value as { boxes: AnimBox[] }).boxes)} />
		}
		@case 'tree': {
			<TreeView nodes={track(() => (snapshot.value as { nodes: TreeNode[] }).nodes)} />
		}
	}
}
