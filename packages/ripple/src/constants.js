export const TEMPLATE_FRAGMENT = 1;
export const TEMPLATE_USE_IMPORT_NODE = 1 << 1;
export const IS_CONTROLLED = 1 << 2;
export const IS_INDEXED = 1 << 3;
// A @for whose component body is its sole root: renders before the parent
// `__anchor` (sibling semantics, no `<!>` wrapper). Distinct from IS_CONTROLLED,
// which renders inside a parent element.
export const ROOT_CONTROLLED = 1 << 4;
export const TEMPLATE_SVG_NAMESPACE = 1 << 5;
export const TEMPLATE_MATHML_NAMESPACE = 1 << 6;

export const HYDRATION_START = '[';
export const HYDRATION_END = ']';
export const HYDRATION_ERROR = {};

// Streaming SSR slot markers. A `<!--[?N-->` comment opens the slot of flush
// unit N whose content has not been streamed yet (the slot shows the pending
// fallback, or nothing for catch-only boundaries). The inline stream runtime
// rewrites the slot to plain `<!--[-->…<!--]-->` when the unit's chunk
// arrives, or to `<!--[!N-->` when the unit errored after its region was
// already on the wire.
export const HYDRATION_START_PENDING = '[?';
export const HYDRATION_START_ERRORED = '[!';

export const STREAM_CHUNK_ATTR = 'data-ripple-chunk';
export const STREAM_HEAD_ATTR = 'data-ripple-head';
export const STREAM_ERROR_SCRIPT_PREFIX = '__ripple_te_';

export const BLOCK_OPEN = `<!--${HYDRATION_START}-->`;
export const BLOCK_CLOSE = `<!--${HYDRATION_END}-->`;
export const EMPTY_COMMENT = `<!---->`;

export const ELEMENT_NODE = 1;
export const TEXT_NODE = 3;
export const COMMENT_NODE = 8;
export const DOCUMENT_FRAGMENT_NODE = 11;
