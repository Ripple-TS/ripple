import { createTrustedScriptURL } from 'ripple/csp';

// A fixed, reviewed URL is a trust boundary. Never read it from query parameters
// or HTML supplied by users. strict-dynamic trusts this loader's descendants.
export function connectVendor() {
	let disposed = false;
	let cleanup;
	const script = document.createElement('script');
	script.src = createTrustedScriptURL('/app/security/vendor.js');
	const loaded = () => {
		if (!disposed) cleanup = window.exampleVendor.mount();
	};
	script.addEventListener('load', loaded);
	document.head.append(script);
	return () => {
		disposed = true;
		script.removeEventListener('load', loaded);
		cleanup?.();
		script.remove();
	};
}
