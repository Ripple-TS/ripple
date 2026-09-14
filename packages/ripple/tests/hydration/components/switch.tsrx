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
	const status = track<'a' | 'b' | 'c'>('a');
	<>
		<button
			class="toggle"
			onClick={() => {
				if (status.value === 'a') status.value = 'b';
				else if (status.value === 'b') status.value = 'c';
				else status.value = 'a';
			}}
		>{'Toggle'}</button>
		@switch (status.value) {
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
	const level = track<1 | 2 | 3>(1);
	<>
		<button
			class="level-toggle"
			onClick={() => {
				if (level.value === 1) level.value = 2;
				else if (level.value === 2) level.value = 3;
				else level.value = 1;
			}}
		>{'Toggle Level'}</button>
		@switch (level.value) {
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
	const level = track<1 | 2 | 3>(1);
	<>
		<button
			class="block-toggle"
			onClick={() => {
				if (level.value === 1) level.value = 2;
				else if (level.value === 2) level.value = 3;
				else level.value = 1;
			}}
		>{'Toggle'}</button>
		@switch (level.value) {
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
	const level = track<1 | 2 | 3>(1);
	<>
		<button
			class="nobreak-toggle"
			onClick={() => {
				if (level.value === 1) level.value = 2;
				else if (level.value === 2) level.value = 3;
				else level.value = 1;
			}}
		>{'Toggle'}</button>
		@switch (level.value) {
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
