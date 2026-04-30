export {
	createTSRXMcpServer,
	analyze_tsrx_handler,
	compile_tsrx_handler,
	detect_target_handler,
	format_tsrx_handler,
	get_documentation_handler,
	inspect_project_handler,
	list_sections_handler,
	validate_tsrx_file_handler,
} from './server.js';

export { handleTSRXMcpNodeRequest } from './http.js';
export { analyze_tsrx } from './analyze.js';
export { compile_tsrx } from './compile.js';
export { format_tsrx } from './format.js';
export { inspect_project } from './inspect.js';
export { validate_tsrx_file } from './validate.js';
export { detect_target, TARGET_CANDIDATES } from './target.js';
export {
	documentation_sections,
	find_documentation_section,
	find_similar_documentation_sections,
	list_documentation_sections,
} from './docs.js';
