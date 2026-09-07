import { useState } from 'octane';
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

function TableView(props: { rows: TableRow[] }) @{
	<table class="uibench-table" data-kind="table">
		<tbody>
			@for (const row of props.rows; key row.id) {
				<tr data-id={row.id} class={row.active ? 'active' : 'inactive'}>
					<th>{row.label as string}</th>
					@for (const cell of row.cells; key cell.id) {
						<td>{cell.text as string}</td>
					}
				</tr>
			}
		</tbody>
	</table>
}

function AnimView(props: { boxes: AnimBox[] }) @{
	<div class="uibench-anim" data-kind="anim">
		@for (const box of props.boxes; key box.id) {
			<div class="box" data-id={box.id} style={{ transform: box.transform }}></div>
		}
	</div>
}

function TreeItem(props: { node: TreeNode }) @{
	<li data-id={props.node.id} class={props.node.children.length === 0 ? 'leaf' : 'container'}>
		<span>{props.node.label as string}</span>
		@if (props.node.children.length > 0) {
			<ul>
				@for (const child of props.node.children; key child.id) {
					<TreeItem node={child} />
				}
			</ul>
		}
	</li>
}

function TreeView(props: { nodes: TreeNode[] }) @{
	<ul class="uibench-tree" data-kind="tree">
		@for (const node of props.nodes; key node.id) {
			<TreeItem node={node} />
		}
	</ul>
}

export default function App() @{
	const [snapshot, setSnapshot] = useState<Snapshot>(INITIAL_SNAPSHOT as Snapshot);
	bindSetter(setSnapshot);
	@switch (snapshot.kind) {
		@case 'table': {
			<TableView rows={snapshot.rows} />
		}
		@case 'anim': {
			<AnimView boxes={snapshot.boxes} />
		}
		@case 'tree': {
			<TreeView nodes={snapshot.nodes} />
		}
	}
}
