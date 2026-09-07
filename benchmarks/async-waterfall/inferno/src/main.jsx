import { Component, render, rerender } from 'inferno';
import { fetchData, LEVELS } from './data.js';

// Inferno has no Suspense/hooks API. Its native class lifecycle mounts the
// recursive child immediately, so all independent level requests start in one
// wave while each level publishes its own result through setState.
class Level extends Component {
	constructor(props) {
		super(props);
		this.state = { data: '' };
	}

	componentDidMount() {
		this.load(this.props.version);
	}

	componentWillReceiveProps(nextProps) {
		if (nextProps.version !== this.props.version) this.load(nextProps.version);
	}

	load(version) {
		fetchData(this.props.level, version).then((data) => this.setState({ data }));
	}

	render() {
		const { level, version } = this.props;
		return (
			<div className="level" data-level={level}>
				<span className="val">{this.state.data}</span>
				{level < LEVELS - 1 ? <Level level={level + 1} version={version} /> : null}
			</div>
		);
	}
}

class Main extends Component {
	constructor(props) {
		super(props);
		this.state = { version: 0 };
		window.__bump = () => {
			this.setState(({ version }) => ({ version: version + 1 }));
			rerender();
		};
	}

	render() {
		return <Level level={0} version={this.state.version} />;
	}
}

const target = document.getElementById('main');
const DEEP = `[data-level="${LEVELS - 1}"] .val`;

function waitForDeep(expected, startedAt) {
	return new Promise((resolve) => {
		const check = () => {
			const element = document.querySelector(DEEP);
			if (element && element.textContent === expected) {
				observer.disconnect();
				resolve(performance.now() - startedAt);
			}
		};
		const observer = new MutationObserver(check);
		observer.observe(document.body, { childList: true, characterData: true, subtree: true });
		check();
	});
}

let version = 0;

window.__init = () => {
	const startedAt = performance.now();
	render(<Main />, target);
	return waitForDeep(`L${LEVELS - 1}:v0`, startedAt);
};

window.__update = () => {
	version++;
	const startedAt = performance.now();
	window.__bump();
	return waitForDeep(`L${LEVELS - 1}:v${version}`, startedAt);
};
