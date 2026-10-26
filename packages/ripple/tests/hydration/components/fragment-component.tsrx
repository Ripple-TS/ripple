import { track } from 'ripple';

export function App({ label, onClick }) @{
	<main>
		<Body label={label} onClick={onClick} />
	</main>
}

function Body({ label, onClick }) @{
	<><Row label={label} onClick={onClick} /></>
}

export function Row({ label, onClick }) @{
	@if (label) {
		<button aria-label={label} onClick={onClick}>Press</button>
	}
}

export function FragmentRoot({ Child, label, onClick }) @{
	<><Child label={label} onClick={onClick} /></>
}

export function FragmentWithSiblings({ Child, label, onClick }) @{
	<>
		<Child label={label} onClick={onClick} />
		<button data-after="" onClick={onClick}>After</button>
	</>
}

export function LoopChild({ label, onClick }) @{
	@for (const item of label ? [1, 2] : []) {
		<button data-item={item} aria-label={label} onClick={onClick}>Press</button>
	}
}

export function SwitchChild({ label, onClick }) @{
	@switch (label) {
		@case 'Click': {
			<button aria-label={label} onClick={onClick}>Press</button>
		}
		@default: {
			<></>
		}
	}
}

export function TryChild({ label, onClick }) @{
	@try {
		<button aria-label={label} onClick={onClick}>Press</button>
	} @catch (error) {
		<span>Failed</span>
	}
}

export function PlainChild({ label, onClick }) @{
	<button aria-label={label} onClick={onClick}>Press</button>
}

export function EmptyChild() @{
	<></>
}

export function NestedChild({ label, onClick }) @{
	<><Body label={label} onClick={onClick} /></>
}

export function BranchLocalChild({ label, onClick }) @{
	@if (label) {
		function Local() @{
			<><Row label={label} onClick={onClick} /></>
		}
		<Local />
	}
}

export function ToggleChild() @{
	const visible = track(true);
	<main>
		<ReactiveBody visible={visible} />
		<button data-after="" onClick={() => (visible.value = true)}>Restore</button>
	</main>
}

function ReactiveBody({ visible }) @{
	<><ReactiveRow visible={visible} /></>
}

function ReactiveRow({ visible }) @{
	@if (visible.value) {
		<button aria-label="Click" onClick={() => (visible.value = false)}>Press</button>
	}
}
