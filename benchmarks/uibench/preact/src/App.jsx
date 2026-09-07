import { useState } from 'preact/hooks';
import { bindSetter } from '../../shared/bridge.js';
import { INITIAL_SNAPSHOT } from '../../shared/workloads.js';

function TableView({ rows }) {
	return (
		<table className="uibench-table" data-kind="table">
			<tbody>
				{rows.map((row) => (
					<tr key={row.id} data-id={row.id} className={row.active ? 'active' : 'inactive'}>
						<th>{row.label}</th>
						{row.cells.map((cell) => (
							<td key={cell.id}>{cell.text}</td>
						))}
					</tr>
				))}
			</tbody>
		</table>
	);
}

function AnimView({ boxes }) {
	return (
		<div className="uibench-anim" data-kind="anim">
			{boxes.map((box) => (
				<div key={box.id} className="box" data-id={box.id} style={{ transform: box.transform }} />
			))}
		</div>
	);
}

function TreeItem({ node }) {
	return (
		<li data-id={node.id} className={node.children.length === 0 ? 'leaf' : 'container'}>
			<span>{node.label}</span>
			{node.children.length > 0 ? (
				<ul>
					{node.children.map((child) => (
						<TreeItem key={child.id} node={child} />
					))}
				</ul>
			) : null}
		</li>
	);
}

function TreeView({ nodes }) {
	return (
		<ul className="uibench-tree" data-kind="tree">
			{nodes.map((node) => (
				<TreeItem key={node.id} node={node} />
			))}
		</ul>
	);
}

export default function App() {
	const [snapshot, setSnapshot] = useState(INITIAL_SNAPSHOT);
	bindSetter(setSnapshot);

	if (snapshot.kind === 'table') return <TableView rows={snapshot.rows} />;
	if (snapshot.kind === 'anim') return <AnimView boxes={snapshot.boxes} />;
	return <TreeView nodes={snapshot.nodes} />;
}
