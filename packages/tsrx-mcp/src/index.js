export {
	createTSRXMcpServer,
	compile_tsrx_handler,
	detect_target_handler,
	get_documentation_handler,
	list_sections_handler,
} from './server.js';

export { compile_tsrx } from './compile.js';
export { detect_target, TARGET_CANDIDATES } from './target.js';
export {
	documentation_sections,
	find_documentation_section,
	find_similar_documentation_sections,
	list_documentation_sections,
} from './docs.js';
