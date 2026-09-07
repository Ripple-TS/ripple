import { Component } from 'inferno';

export class Header extends Component {
	constructor(props) {
		super(props);
		this.state = { dark: false };
	}

	render() {
		const { dark } = this.state;
		return (
			<header class={dark ? 'masthead dark' : 'masthead'}>
				<h1 class="logo">The Octane Times</h1>
				<button id="theme" class="theme" onClick={() => this.setState({ dark: !dark })}>
					{dark ? 'Light mode' : 'Dark mode'}
				</button>
			</header>
		);
	}
}
