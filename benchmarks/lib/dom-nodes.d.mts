export interface DomNodeCensus {
	root: string;
	total: number;
	elements: number;
	text: number;
	comments: number;
	emptyText: number;
	whitespaceText: number;
	hydrationMarkersPhysical: number;
	hydrationMarkersLogical: number;
	hydrationMarkersCounted: number;
	hydrationMarkerMaxMultiplicity: number;
	leadingHydrationStartsPhysical: number;
	leadingHydrationStartsLogical: number;
	commentsByData: Record<string, number>;
	commentParents: Record<string, number>;
}

export function censusDomNodes(rootSelector?: string): DomNodeCensus;

export interface DeterministicCount {
	median: number;
	min: number;
	samples: number[];
}

export function deterministicCount(value: number): DeterministicCount;

export interface DeterministicJsonStat {
	median: number;
	min: number;
	samples: number;
}

export function deterministicStatForJson(stat: DeterministicCount): DeterministicJsonStat;
