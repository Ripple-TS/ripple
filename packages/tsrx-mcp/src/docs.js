export { documentation_sections } from './generated/docs.js';

import { documentation_sections } from './generated/docs.js';

/** @typedef {{ slug: string, title: string, use_cases: string, content: string }} DocumentationSection */

/**
 * @param {string} value
 */
function normalize(value) {
	return value
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '');
}

/**
 * @returns {DocumentationSection[]}
 */
export function list_documentation_sections() {
	return documentation_sections;
}

/**
 * @param {string} section
 */
export function find_documentation_section(section) {
	const normalized = normalize(section);
	return (
		documentation_sections.find(
			(candidate) =>
				candidate.slug === normalized ||
				normalize(candidate.title) === normalized ||
				candidate.slug === section,
		) ?? null
	);
}

/**
 * @param {string} section
 */
export function find_similar_documentation_sections(section) {
	const normalized = normalize(section);
	return documentation_sections.filter(
		(candidate) =>
			candidate.slug.includes(normalized) ||
			normalize(candidate.title).includes(normalized) ||
			candidate.use_cases.toLowerCase().includes(section.toLowerCase()),
	);
}
