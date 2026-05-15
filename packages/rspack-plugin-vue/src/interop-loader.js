import { addVaporInteropToCreateVaporApp } from '@tsrx/vue/interop';

/**
 * @param {string} source
 * @returns {string}
 */
export default function interopLoader(source) {
	return addVaporInteropToCreateVaporApp(source);
}
