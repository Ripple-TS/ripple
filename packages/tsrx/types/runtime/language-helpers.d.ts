export const get_descriptor: typeof Object.getOwnPropertyDescriptor;
export const get_descriptors: typeof Object.getOwnPropertyDescriptors;
export const array_from: typeof Array.from;
export const is_array: typeof Array.isArray;
export const define_property: typeof Object.defineProperty;
export const get_prototype_of: typeof Object.getPrototypeOf;
export const object_values: typeof Object.values;
export const object_entries: typeof Object.entries;
export const object_keys: typeof Object.keys;
export const get_own_property_symbols: typeof Object.getOwnPropertySymbols;
export const structured_clone: typeof structuredClone;
export const object_prototype: typeof Object.prototype;
export const array_prototype: typeof Array.prototype;
export const has_own_property: typeof Object.prototype.hasOwnProperty;

export function has_prototype_accessor(value: object, key: PropertyKey): boolean;
export function array_slice(array_like: ArrayLike<any>, ...args: number[]): any[];
