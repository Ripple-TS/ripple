import { createContext } from 'svelte';

export const [getRootContext, setRootContext] = createContext();
export const [getLocalContext, setLocalContext] = createContext();
export const DEFAULT_LOCAL = Object.freeze({ value: 0 });
