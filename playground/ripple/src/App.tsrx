import { track } from 'ripple';

export component App() {
	let &[count] = track(0);

	{text count++}
}
