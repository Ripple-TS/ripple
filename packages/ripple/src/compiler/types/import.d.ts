/**
 * Types for Hidden Imports in TSX Generated Code
 *
 * Adds uniquely named exports to account for hidden imports
 * in the tsx generated code for language server / IDE support.
 * This is necessary because we need to keep hidden imports named differently
 * for full TS support including adding missing imports in source and
 * property reporting missing imports.
 *
 * The types are obfuscated to avoid name collisions and provide
 * sufficiently different names so that TS cannot attempt to infer that
 * the user made a mistake when the user is missing an import.
 *
 * e.g.
 * // import { RippleMap } from 'ripple'; -- assume RippleMap import is missing
 * const map = new RippleMap();
 *
 * If a type in the hidden import contains 'RippleMap', e.g. '__RippleMap',
 * TS would suggest to the user that they meant to use '__RippleMap' instead of 'RippleMap'.
 *
 * Add additional types as needed if they are used in hidden imports.
 *
 * This file is used by the package.json in exports
 * The exports path is used by the TS compiler to resolve types.
 *
 * The intellisense is intercepted by hover language plugin
 * to replace the obfuscated names with the actual types.
 *
 * Do not rename or move without updating those paths.
 */

import {
	RippleMap as _$_Map__Ripple,
	RippleSet as _$_Set__Ripple,
	RippleArray as _$_Array__Ripple,
	RippleObject as _$_Object__Ripple,
	Context as _$_Context__Ripple,
	RippleURL as _$_URL__Ripple,
	RippleURLSearchParams as _$_URLSearchParams__Ripple,
	RippleDate as _$_Date__Ripple,
	MediaQuery as _$_MediaQuery__,
	createRefKey as _$_RefKey__create,
	track as _$_track__,
	effect as _$_effect__,
	untrack as _$_untrack__,
	ripple_namespace as _$__u0023_ripple,
} from 'ripple';

export {
	_$_Map__Ripple,
	_$_Set__Ripple,
	_$_Array__Ripple,
	_$_Object__Ripple,
	_$_Context__Ripple,
	_$_URL__Ripple,
	_$_URLSearchParams__Ripple,
	_$_Date__Ripple,
	_$_MediaQuery__,
	_$_RefKey__create,
	_$_track__,
	_$_effect__,
	_$_untrack__,
	_$__u0023_ripple,
};
