// Deterministic DOM-shape instrumentation shared by the browser benchmarks.
// Pass this function directly to Playwright's page.evaluate: it is deliberately
// self-contained because the browser receives only the serialized function.
export function censusDomNodes(rootSelector = '#main') {
	const root =
		rootSelector === 'body'
			? document.body
			: document.querySelector(rootSelector) ||
				(rootSelector === '#main' ? document.querySelector('#app') : null);
	if (root === null) throw new Error(`DOM census root not found: ${rootSelector}`);

	// Hydration range comments use `[` / `]` for one logical boundary and
	// `[N` / `]N` for N >= 2 coincident boundaries sharing one physical Comment.
	// Keep this parser inside the census function: Playwright serializes only
	// this function when it is passed directly to page.evaluate.
	const parseHydrationMarker = (data) => {
		const kind = data.charCodeAt(0);
		if (kind !== 91 && kind !== 93) return null; // `[` / `]`
		if (data.length === 1) return { start: kind === 91, multiplicity: 1, counted: false };
		const encoded = data.slice(1);
		// Canonical positive decimal integer: reject zero, signs, decimals,
		// whitespace, leading zeroes, and values beyond exact JS integer range.
		if (!/^[1-9]\d*$/.test(encoded)) return null;
		const multiplicity = Number(encoded);
		if (!Number.isSafeInteger(multiplicity) || multiplicity < 2) return null;
		return { start: kind === 91, multiplicity, counted: true };
	};

	let total = 0;
	let elements = 0;
	let text = 0;
	let comments = 0;
	let emptyText = 0;
	let whitespaceText = 0;
	let hydrationMarkersPhysical = 0;
	let hydrationMarkersLogical = 0;
	let hydrationMarkersCounted = 0;
	let hydrationMarkerMaxMultiplicity = 0;
	const commentsByData = Object.create(null);
	const commentParents = Object.create(null);
	const walker = document.createTreeWalker(root, NodeFilter.SHOW_ALL);
	while (walker.nextNode()) {
		const node = walker.currentNode;
		total++;
		if (node.nodeType === Node.ELEMENT_NODE) {
			elements++;
		} else if (node.nodeType === Node.TEXT_NODE) {
			text++;
			const value = node.nodeValue || '';
			if (value.length === 0) emptyText++;
			else if (value.trim().length === 0) whitespaceText++;
		} else if (node.nodeType === Node.COMMENT_NODE) {
			comments++;
			const data = node.nodeValue || '';
			const hydrationMarker = parseHydrationMarker(data);
			if (hydrationMarker !== null) {
				hydrationMarkersPhysical++;
				hydrationMarkersLogical += hydrationMarker.multiplicity;
				if (hydrationMarker.counted) hydrationMarkersCounted++;
				if (hydrationMarker.multiplicity > hydrationMarkerMaxMultiplicity) {
					hydrationMarkerMaxMultiplicity = hydrationMarker.multiplicity;
				}
			}
			commentsByData[data] = (commentsByData[data] || 0) + 1;
			const parent = node.parentElement;
			const parentKey =
				parent === null
					? '(non-element)'
					: parent.localName +
						(parent.id ? '#' + parent.id : '') +
						(parent.classList.length ? '.' + [...parent.classList].join('.') : '');
			commentParents[parentKey] = (commentParents[parentKey] || 0) + 1;
		}
	}

	// The website regression that motivated counted markers is a run of logical
	// opens at the start of <main>. Report both physical comments and decoded
	// logical depth so coalescing is visible without mistaking it for lost ranges.
	let leadingHydrationStartsPhysical = 0;
	let leadingHydrationStartsLogical = 0;
	for (let node = root.firstChild; node !== null; node = node.nextSibling) {
		if (node.nodeType !== Node.COMMENT_NODE) break;
		const marker = parseHydrationMarker(node.nodeValue || '');
		if (marker === null || !marker.start) break;
		leadingHydrationStartsPhysical++;
		leadingHydrationStartsLogical += marker.multiplicity;
	}

	const sortedEntries = (record) =>
		Object.fromEntries(
			Object.entries(record).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])),
		);
	return {
		root: root === document.body ? 'body' : root.id ? '#' + root.id : rootSelector,
		total,
		elements,
		text,
		comments,
		emptyText,
		whitespaceText,
		hydrationMarkersPhysical,
		hydrationMarkersLogical,
		hydrationMarkersCounted,
		hydrationMarkerMaxMultiplicity,
		leadingHydrationStartsPhysical,
		leadingHydrationStartsLogical,
		commentsByData: sortedEntries(commentsByData),
		commentParents: sortedEntries(commentParents),
	};
}

export function deterministicCount(value) {
	return { median: value, min: value, samples: [value], unit: 'count', direction: 'lower' };
}

export function deterministicStatForJson(stat) {
	return {
		unit: 'count',
		direction: 'lower',
		median: stat.median,
		min: stat.min,
		samples: Array.isArray(stat.samples) ? stat.samples.length : stat.samples,
	};
}
