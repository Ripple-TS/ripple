// Portal components for hydration testing
import { Portal, track } from 'ripple';

// Simple portal with static content
export function SimplePortal() @{
	<div class="container">
		<h1>{'Main Content'}</h1>
		<Portal target={typeof document !== 'undefined' ? document.body : null}>
			<div class="portal-content">{'Portal content'}</div>
		</Portal>
	</div>
}

// Portal with conditional rendering
export function ConditionalPortal() @{
	let &[show] = track(true);
	<div class="container">
		<button class="toggle" onClick={() => (show = !show)}>{'Toggle'}</button>
		@if (show) {
			<Portal target={typeof document !== 'undefined' ? document.body : null}>
				<div class="portal-content">{'Portal is visible'}</div>
			</Portal>
		}
	</div>
}

// Component with portal that shouldn't break on initial load
export function PortalWithMainContent() @{
	<div>
		<div class="main-content">{'Main page content'}</div>
		<Portal target={typeof document !== 'undefined' ? document.body : null}>
			<div class="portal-content">{'Modal content'}</div>
		</Portal>
		<div class="footer">{'Footer'}</div>
	</div>
}

// Nested portals scenario
export function NestedContentWithPortal() @{
	<div class="outer">
		<div class="inner">
			<span>{'Nested content'}</span>
		</div>
		<Portal target={typeof document !== 'undefined' ? document.body : null}>
			<div class="portal-content">{'Portal content'}</div>
		</Portal>
	</div>
}
