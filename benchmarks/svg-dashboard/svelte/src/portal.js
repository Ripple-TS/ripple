// Attachment portal (same as benchmarks/portal-swarm/svelte/src/portal.js):
// moves the attached element into `target`; cleanup removes it.
export function portalTo(target) {
	return (element) => {
		target.appendChild(element);
		return () => {
			element.remove();
		};
	};
}
