/** A custom type's synchronous serialization pair for hydration and RPC. */
export interface Transporter<T = any, Encoded = any> {
	/** Return truthy serializable data, or false/undefined for values not handled. */
	encode: (value: unknown) => Encoded | false | undefined;
	decode: (data: Encoded) => T;
}

export type Transport = Record<string, Transporter>;

/**
 * Register the app's transport once, before rendering, hydration, mounting or
 * RPC. The Vite plugin calls this automatically for ripple.config.ts transport.
 * Omit the argument or pass an empty object to restore built-in serialization.
 */
export function setTransport(transport?: Transport): void;
