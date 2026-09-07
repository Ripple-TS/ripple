export function portalTo(target) {
	return (element) => {
		target.appendChild(element);
		return () => {
			element.remove();
		};
	};
}
