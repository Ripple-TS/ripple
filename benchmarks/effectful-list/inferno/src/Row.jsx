import { Component } from 'inferno';
import { fx, rowRef } from './fx.js';

// Native Inferno class row. Cross-module and not memoized: every parent update
// reaches all 1000 row instances. Mount/unmount lifecycles model the row
// resource, componentDidUpdate performs the value-dependent layout read, and
// the shared rowRef callback's returned cleanup is retained until unmount.

export default class Row extends Component {
	setCell = (cell) => {
		if (cell) this.cell = cell;
	};

	setRow = (row) => {
		if (row && !this.refCleanup) this.refCleanup = rowRef(row);
	};

	recordLayout() {
		if (this.props.item.probe) {
			fx.h += this.cell.offsetHeight;
			fx.layouts++;
		}
	}

	componentDidMount() {
		fx.mounts++;
		this.recordLayout();
	}

	componentDidUpdate(previousProps) {
		if (previousProps.item.value !== this.props.item.value) this.recordLayout();
	}

	componentWillUnmount() {
		fx.cleanups++;
		this.refCleanup?.();
		this.refCleanup = null;
	}

	render() {
		const { item } = this.props;
		return (
			<tr ref={this.setRow}>
				<td className="col-id" ref={this.setCell}>
					{item.id}
				</td>
				<td className="col-label">{item.label}</td>
				<td className="col-value">{item.value}</td>
			</tr>
		);
	}
}
