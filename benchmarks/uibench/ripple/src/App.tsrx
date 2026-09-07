import { track, type Tracked } from 'ripple';
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

interface RippleTableRow extends Omit<TableRow, 'active'> {
	active: Tracked<boolean>;
}

interface RippleAnimBox extends Omit<AnimBox, 'transform'> {
	transform: Tracked<string>;
}

type RippleSnapshot =
	| { kind: 'table'; rows: RippleTableRow[] }
	| { kind: 'anim'; boxes: RippleAnimBox[] }
	| { kind: 'tree'; nodes: TreeNode[] };

function TableView(props: { rows: RippleTableRow[] }) @{
	<table class="uibench-table" data-kind="table">
		<tbody>
			@for (const row of props.rows; key row.id) {
				<tr data-id={row.id} class={row.active.value ? 'active' : 'inactive'}>
					<th>{row.label as string}</th>
					@for (const cell of row.cells; key cell.id) {
						<td>{cell.text as string}</td>
					}
				</tr>
			}
		</tbody>
	</table>
}

function AnimView(props: { boxes: RippleAnimBox[] }) @{
	<div class="uibench-anim" data-kind="anim">
		@for (const box of props.boxes; key box.id) {
			<div class="box" data-id={box.id} style={{ transform: box.transform.value }}></div>
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
	const rowCache = new Map<string, RippleTableRow>();
	const boxCache = new Map<string, RippleAnimBox>();

	const adapt = (next: Snapshot): RippleSnapshot => {
		if (next.kind === 'table') {
			return {
				kind: 'table',
				rows: next.rows.map((row) => {
					let current = rowCache.get(row.id);
					if (current === undefined) {
						current = { ...row, active: track(row.active) };
						rowCache.set(row.id, current);
					} else {
						current.label = row.label;
						current.cells = row.cells;
						current.active.value = row.active;
					}
					return current;
				}),
			};
		}
		if (next.kind === 'anim') {
			return {
				kind: 'anim',
				boxes: next.boxes.map((box) => {
					let current = boxCache.get(box.id);
					if (current === undefined) {
						current = { ...box, transform: track(box.transform) };
						boxCache.set(box.id, current);
					} else {
						current.transform.value = box.transform;
					}
					return current;
				}),
			};
		}
		return next;
	};

	let &[snapshot] = track<RippleSnapshot>(adapt(INITIAL_SNAPSHOT as Snapshot));
	bindSetter((next: Snapshot) => {
		snapshot = adapt(next);
	});

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
