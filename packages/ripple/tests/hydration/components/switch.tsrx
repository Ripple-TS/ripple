import { track } from 'ripple';

export function SwitchStatic() @{
	const status: string = 'success';
	@switch (status) {
		@case 'success': {
			<div class="status-success">{'Success'}</div>
		}
		@case 'error': {
			<div class="status-error">{'Error'}</div>
		}
		@default: {
			<div class="status-unknown">{'Unknown'}</div>
		}
	}
}

export function SwitchReactive() @{
	let &[status] = track<'a' | 'b' | 'c'>('a');
	<>
		<button
			class="toggle"
			onClick={() => {
				if (status === 'a') status = 'b';
				else if (status === 'b') status = 'c';
				else status = 'a';
			}}
		>{'Toggle'}</button>
		@switch (status) {
			@case 'a': {
				<div class="case-a">Case A</div>
			}
			@case 'b': {
				<div class="case-b">Case B</div>
			}
			@default: {
				<div class="case-c">{'Case C'}</div>
			}
		}
	</>
}

export function SwitchFallthrough() @{
	const val: number = 1;
	@switch (val) {
		@case 1: {
		}
		@case 2: {
			<div class="case-1-2">{'1 or 2'}</div>
		}
		@default: {
			<div class="case-other">{'Other'}</div>
		}
	}
}

export function SwitchNumericLevels() @{
	let &[level] = track<1 | 2 | 3>(1);
	<>
		<button
			class="level-toggle"
			onClick={() => {
				if (level === 1) level = 2;
				else if (level === 2) level = 3;
				else level = 1;
			}}
		>{'Toggle Level'}</button>
		@switch (level) {
			@case 1: {
				<div class="level-1">{'Level 1'}</div>
			}
			@case 2: {
				<div class="level-2">{'Level 2'}</div>
			}
			@case 3: {
				<div class="level-3">{'Level 3'}</div>
			}
		}
	</>
}

export function SwitchBlockScoped() @{
	let &[level] = track<1 | 2 | 3>(1);
	<>
		<button
			class="block-toggle"
			onClick={() => {
				if (level === 1) level = 2;
				else if (level === 2) level = 3;
				else level = 1;
			}}
		>{'Toggle'}</button>
		@switch (level) {
			@case 1: {
				<div class="block-1">{'Block 1'}</div>
			}
			@case 2: {
				<div class="block-2">{'Block 2'}</div>
			}
			@case 3: {
				<div class="block-3">{'Block 3'}</div>
			}
		}
	</>
}

export function SwitchNoBreak() @{
	let &[level] = track<1 | 2 | 3>(1);
	<>
		<button
			class="nobreak-toggle"
			onClick={() => {
				if (level === 1) level = 2;
				else if (level === 2) level = 3;
				else level = 1;
			}}
		>{'Toggle'}</button>
		@switch (level) {
			@case 1: {
				<div class="nobreak-1">{'NoBreak 1'}</div>
			}
			@case 2: {
				<div class="nobreak-2">{'NoBreak 2'}</div>
			}
			@case 3: {
				<div class="nobreak-3">{'NoBreak 3'}</div>
			}
		}
	</>
}
