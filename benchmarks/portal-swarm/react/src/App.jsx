import { useState } from 'react';
import { createPortal } from 'react-dom';
import { ITEMS, sharedTarget, targetFor, hit } from './data.js';
import { bindA, bindB, bindBS } from './ops.js';
import { makeTipB, stableTipBS } from './tips.js';

// React 19 portal-swarm twin. Same three sections as the octane app:
//   A        — ReactDOM.createPortal written inline at JSX child position.
//   B        — portal elements built by a plain createElement helper (tips.js)
//              reaching the DOM through a children expression.
//   B_stable — section B with module-level reference-stable portal elements
//              (React bails on identical element references).
// For React, A and B are the SAME mechanism (both produce a ReactPortal element
// through the same reconciler path) — the split mirrors octane's two entry
// points (compiled portal() fast path vs childSlot value path).

function TipA({ item, target }) {
	return (
		<span className="anchor">
			{createPortal(
				<div className="tip tipA">
					<span className="tip-label">{item.label}</span>
					<button className="tip-btn" onClick={hit}>
						hit
					</button>
				</div>,
				target,
			)}
		</span>
	);
}

function SectionA() {
	const [open, setOpen] = useState(false);
	const [tick, setTick] = useState(0);
	const [distinct, setDistinct] = useState(false);
	bindA(setOpen, setTick, setDistinct);

	return (
		<section className="secA">
			<h3 className="tick">{'A:' + tick}</h3>
			<ul className="list">
				{ITEMS.map((item) => (
					<li className="item" key={item.id}>
						<span className="label">{item.label}</span>
						{open ? (
							<TipA item={item} target={distinct ? targetFor(item.id) : sharedTarget()} />
						) : null}
					</li>
				))}
			</ul>
		</section>
	);
}

function ItemB({ item, open, distinct }) {
	return (
		<li className="item">
			<span className="label">{item.label}</span>
			{open ? makeTipB(item, distinct) : null}
		</li>
	);
}

function SectionB() {
	const [open, setOpen] = useState(false);
	const [tick, setTick] = useState(0);
	const [distinct, setDistinct] = useState(false);
	bindB(setOpen, setTick, setDistinct);

	return (
		<section className="secB">
			<h3 className="tick">{'B:' + tick}</h3>
			<ul className="list">
				{ITEMS.map((item) => (
					<ItemB item={item} open={open} distinct={distinct} key={item.id} />
				))}
			</ul>
		</section>
	);
}

function ItemBS({ item, open, distinct }) {
	return (
		<li className="item">
			<span className="label">{item.label}</span>
			{open ? stableTipBS(item, distinct) : null}
		</li>
	);
}

function SectionBS() {
	const [open, setOpen] = useState(false);
	const [tick, setTick] = useState(0);
	const [distinct, setDistinct] = useState(false);
	bindBS(setOpen, setTick, setDistinct);

	return (
		<section className="secBS">
			<h3 className="tick">{'BS:' + tick}</h3>
			<ul className="list">
				{ITEMS.map((item) => (
					<ItemBS item={item} open={open} distinct={distinct} key={item.id} />
				))}
			</ul>
		</section>
	);
}

// 200 container divs for distinct-target mode — rendered by the fixture itself.
function Targets() {
	return (
		<div className="targets">
			{ITEMS.map((item) => (
				<div className="pt" id={'pt-' + item.id} key={item.id}></div>
			))}
		</div>
	);
}

export default function App() {
	return (
		<div className="app">
			<SectionA />
			<SectionB />
			<SectionBS />
			<Targets />
		</div>
	);
}
