const DEBUG = process.env.RIPPLE_DEBUG === 'true';
// Matches valid JS/CSS identifier characters: word chars, dashes (CSS), $, and # (Ripple shorthands)
const charAllowedWordRegex = /[\w\-$#]/;

/**
 * Create a logging utility with a specific label
 * @param {string} label
 * @returns {{
 * 	log: (...args: unknown[]) => void,
 * 	logError: (...args: unknown[]) => void,
 * 	logWarning: (...args: unknown[]) => void,
 * }}
 */
function createLogging(label) {
	return {
		log(...args) {
			if (DEBUG) {
				console.log(label, ...args);
			}
		},
		logError(...args) {
			if (DEBUG) {
				console.error(label, ...args);
			}
		},
		logWarning(...args) {
			if (DEBUG) {
				console.warn(label, ...args);
			}
		},
	};
}

/**
 * Get the word at a specific position in the text
 * @param {string} text
 * @param {number} start
 * @returns {{word: string, start: number, end: number}}
 */
function getWordFromPosition(text, start) {
	let wordStart = start;
	let wordEnd = start;
	while (wordStart > 0 && charAllowedWordRegex.test(text[wordStart - 1])) {
		wordStart--;
	}
	while (wordEnd < text.length && charAllowedWordRegex.test(text[wordEnd])) {
		wordEnd++;
	}

	const word = text.substring(wordStart, wordEnd);

	return {
		word,
		start: wordStart,
		end: wordEnd,
	};
}

module.exports = {
	createLogging,
	getWordFromPosition,
	charAllowedWordRegex,
	DEBUG,
};
