export const TEMPLATE_FRAGMENT = 1;
export const TEMPLATE_USE_IMPORT_NODE = 1 << 1;
export const IS_CONTROLLED = 1 << 2;
export const IS_INDEXED = 1 << 3;
export const TEMPLATE_SVG_NAMESPACE = 1 << 5;
export const TEMPLATE_MATHML_NAMESPACE = 1 << 6;

export const HYDRATION_START = '[';
export const HYDRATION_END = ']';
export const HYDRATION_ERROR = {};

export const BLOCK_OPEN = `<!--${HYDRATION_START}-->`;
export const BLOCK_CLOSE = `<!--${HYDRATION_END}-->`;
export const EMPTY_COMMENT = `<!---->`;

export const ELEMENT_NODE = 1;
export const TEXT_NODE = 3;
export const COMMENT_NODE = 8;
export const DOCUMENT_FRAGMENT_NODE = 11;
