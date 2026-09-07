// A fresh implementation of UIbench's published desktop workload matrix.
//
// The upstream repositories declare no usable license text (uibench-base's
// package.json says only "BSD"), so no source or generated asset is vendored.
// The public operation names and workload dimensions are treated as the spec;
// the deterministic data model and transformations below are original to this
// repository. See ../README.md for pinned provenance.

const TABLE_SHAPES = [
	[100, 4],
	[50, 4],
	[100, 2],
	[50, 2],
];
const TABLE_NTHS = [32, 16, 8, 4];
const ANIM_NTHS = [32, 16, 8, 4];
const TREE_SHAPES = [[500], [50, 10], [10, 50], [5, 100], [2, 2, 2, 2, 2, 2, 2, 2, 2, 2]];
const MUTATION_TREE_SHAPES = TREE_SHAPES.slice(0, 4);

const tableSnapshot = (rows) => ({ kind: 'table', rows });
const animSnapshot = (boxes) => ({ kind: 'anim', boxes });
const treeSnapshot = (nodes) => ({ kind: 'tree', nodes });

function shapeLabel(shape) {
	return `[${shape.join(',')}]`;
}

function makeTable(rowCount, columnCount) {
	const rows = [];
	for (let row = 0; row < rowCount; row++) {
		const cells = [];
		for (let column = 0; column < columnCount; column++) {
			// Each column has a different stable permutation so sort/0 and sort/1
			// exercise different keyed orders without randomness in the fixture.
			const value = (row * (37 + column * 16) + column * 29) % 101;
			cells.push({
				id: `c${column}`,
				text: `${String.fromCharCode(97 + column)}${value.toString(36).padStart(2, '0')}`,
			});
		}
		rows.push({
			id: `r${row}`,
			label: `row ${row}`,
			active: false,
			cells,
		});
	}
	return rows;
}

function activateEach(rows, nth) {
	return rows.map((row, index) => ((index + 1) % nth === 0 ? { ...row, active: true } : row));
}

function filterEach(rows, nth) {
	return rows.filter((_row, index) => (index + 1) % nth !== 0);
}

function makeAnim(count) {
	const boxes = [];
	for (let index = 0; index < count; index++) {
		boxes.push({ id: `a${index}`, transform: 'translateX(0px)' });
	}
	return boxes;
}

function advanceEach(boxes, nth) {
	return boxes.map((box, index) =>
		(index + 1) % nth === 0 ? { ...box, transform: 'translateX(1px)' } : box,
	);
}

function makeForest(shape, prefix = 'n') {
	const build = (depth, path) => {
		const nodes = [];
		for (let index = 0; index < shape[depth]; index++) {
			const id = `${prefix}-${path}${index}`;
			const children = depth + 1 < shape.length ? build(depth + 1, `${path}${index}.`) : [];
			nodes.push({ id, label: `node ${path}${index}`, children });
		}
		return nodes;
	};
	return build(0, '');
}

function cloneForest(nodes) {
	return nodes.map((node) => ({
		id: node.id,
		label: node.label,
		children: cloneForest(node.children),
	}));
}

function insertedNode(position, shape) {
	const suffix = shape.join('x');
	return { id: `insert-${position}-${suffix}`, label: `inserted ${position}`, children: [] };
}

function reverse(nodes) {
	return [...nodes].reverse();
}

function moveEndToStart(nodes, count = 1) {
	return [...nodes.slice(-count), ...nodes.slice(0, -count)];
}

function moveStartToEnd(nodes, count = 1) {
	return [...nodes.slice(count), ...nodes.slice(0, count)];
}

function snabbdomWorstCase(nodes) {
	const next = [...nodes];
	const first = next.shift();
	const nearEnd = next.splice(next.length - 2, 1)[0];
	return [...next, first, nearEnd];
}

function addCase(cases, name, before, after) {
	cases.push({ name, before, after });
}

function buildCases() {
	const cases = [];

	for (const [rowCount, columnCount] of TABLE_SHAPES) {
		const shape = `[${rowCount},${columnCount}]`;
		const rows = makeTable(rowCount, columnCount);
		const empty = tableSnapshot([]);
		const full = tableSnapshot(rows);

		addCase(cases, `table/${shape}/render`, empty, full);
		addCase(cases, `table/${shape}/removeAll`, full, empty);
		for (const column of [0, 1]) {
			const sorted = [...rows].sort((a, b) =>
				a.cells[column].text.localeCompare(b.cells[column].text),
			);
			addCase(cases, `table/${shape}/sort/${column}`, full, tableSnapshot(sorted));
		}
		for (const nth of TABLE_NTHS) {
			addCase(cases, `table/${shape}/filter/${nth}`, full, tableSnapshot(filterEach(rows, nth)));
		}
		for (const nth of TABLE_NTHS) {
			addCase(
				cases,
				`table/${shape}/activate/${nth}`,
				full,
				tableSnapshot(activateEach(rows, nth)),
			);
		}
	}

	for (const nth of ANIM_NTHS) {
		const boxes = makeAnim(100);
		addCase(cases, `anim/100/${nth}`, animSnapshot(boxes), animSnapshot(advanceEach(boxes, nth)));
	}

	for (const shape of TREE_SHAPES) {
		const label = shapeLabel(shape);
		const nodes = makeForest(shape, `tree-${shape.join('x')}`);
		addCase(cases, `tree/${label}/render`, treeSnapshot([]), treeSnapshot(nodes));
		addCase(cases, `tree/${label}/removeAll`, treeSnapshot(nodes), treeSnapshot([]));
	}

	for (const shape of MUTATION_TREE_SHAPES) {
		const label = shapeLabel(shape);
		const nodes = makeForest(shape, `mut-${shape.join('x')}`);
		const full = treeSnapshot(nodes);
		addCase(cases, `tree/${label}/[reverse]`, full, treeSnapshot(reverse(nodes)));
		addCase(
			cases,
			`tree/${label}/[insertFirst(1)]`,
			full,
			treeSnapshot([insertedNode('first', shape), ...nodes]),
		);
		addCase(
			cases,
			`tree/${label}/[insertLast(1)]`,
			full,
			treeSnapshot([...nodes, insertedNode('last', shape)]),
		);
		addCase(cases, `tree/${label}/[removeFirst(1)]`, full, treeSnapshot(nodes.slice(1)));
		addCase(cases, `tree/${label}/[removeLast(1)]`, full, treeSnapshot(nodes.slice(0, -1)));
		addCase(
			cases,
			`tree/${label}/[moveFromEndToStart(1)]`,
			full,
			treeSnapshot(moveEndToStart(nodes)),
		);
		addCase(
			cases,
			`tree/${label}/[moveFromStartToEnd(1)]`,
			full,
			treeSnapshot(moveStartToEnd(nodes)),
		);
	}

	const flat = makeForest([500], 'worst');
	const flatSnapshot = treeSnapshot(flat);
	addCase(
		cases,
		'tree/[500]/[kivi_worst_case]',
		flatSnapshot,
		treeSnapshot(reverse(flat.slice(1, -1))),
	);
	addCase(
		cases,
		'tree/[500]/[snabbdom_worst_case]',
		flatSnapshot,
		treeSnapshot(snabbdomWorstCase(flat)),
	);
	addCase(
		cases,
		'tree/[500]/[react_worst_case]',
		flatSnapshot,
		treeSnapshot(moveEndToStart(flat.slice(1, -1))),
	);
	addCase(
		cases,
		'tree/[500]/[virtual_dom_worst_case]',
		flatSnapshot,
		treeSnapshot(moveStartToEnd(flat, 2)),
	);

	for (const shape of [
		[10, 10, 10, 10],
		[2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
	]) {
		const nodes = makeForest(shape, `same-${shape.join('x')}`);
		addCase(
			cases,
			`tree/${shapeLabel(shape)}/no_change`,
			treeSnapshot(nodes),
			treeSnapshot(cloneForest(nodes)),
		);
	}

	return cases;
}

export const CASES = buildCases();
export const INITIAL_SNAPSHOT = tableSnapshot([]);

const CASE_INDEX = new Map(CASES.map((entry) => [entry.name, entry]));

export function caseByName(name) {
	const entry = CASE_INDEX.get(name);
	if (!entry) throw new Error(`unknown UIbench case: ${name}`);
	return entry;
}

export function modelSignature(snapshot) {
	if (snapshot.kind === 'table') {
		return [
			'table',
			...snapshot.rows.map(
				(row) =>
					`${row.id}|${row.active ? 'active' : 'inactive'}|${row.cells.map((cell) => cell.text).join('|')}`,
			),
		].join('\n');
	}
	if (snapshot.kind === 'anim') {
		return ['anim', ...snapshot.boxes.map((box) => `${box.id}|${box.transform}`)].join('\n');
	}
	const lines = ['tree'];
	const visit = (nodes, depth) => {
		for (const node of nodes) {
			lines.push(
				`${depth}|${node.id}|${node.children.length === 0 ? 'leaf' : 'container'}|${node.label}`,
			);
			visit(node.children, depth + 1);
		}
	};
	visit(snapshot.nodes, 0);
	return lines.join('\n');
}

export function elementCount(snapshot) {
	if (snapshot.kind === 'table') {
		return 2 + snapshot.rows.reduce((count, row) => count + 2 + row.cells.length, 0);
	}
	if (snapshot.kind === 'anim') return 1 + snapshot.boxes.length;
	let nodes = 0;
	const visit = (items) => {
		for (const item of items) {
			nodes += item.children.length === 0 ? 2 : 3;
			visit(item.children);
		}
	};
	visit(snapshot.nodes);
	return 1 + nodes;
}
