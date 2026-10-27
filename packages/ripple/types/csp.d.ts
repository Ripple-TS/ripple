import type { TrustedHTML, TrustedScript, TrustedScriptURL } from 'trusted-types/lib';
export type { TrustedHTML, TrustedScript, TrustedScriptURL } from 'trusted-types/lib';

export type HTMLSink = 'template' | 'html' | 'content-editable';
export type ScriptSink = 'template' | 'script' | 'route';

/** Application-owned policy. Reject or sanitize application HTML; it is not a template. */
export interface TrustedTypesPolicy {
	createHTML?(value: string, sink: HTMLSink): TrustedHTML;
	createScript?(value: string, sink: ScriptSink): TrustedScript;
	createScriptURL?(value: string, sink: ScriptSink): TrustedScriptURL;
}

/**
 * Configure before mounting/hydrating. For pre-hydration streamed rich-text
 * snapshots, install in a blocking bootstrap before the stream arrives.
 * No policy is created automatically. Pass null to remove the configuration.
 * On the server this is a no-op; policy/header generation belongs to the app.
 */
export function setTrustedTypesPolicy(policy: TrustedTypesPolicy | null): void;
export function createTrustedHTML(
	value: string | TrustedHTML,
	sink?: HTMLSink,
): string | TrustedHTML;
export function createTrustedScript(
	value: string | TrustedScript,
	sink?: ScriptSink,
): string | TrustedScript;
export function createTrustedScriptURL(
	value: string | TrustedScriptURL,
	sink?: ScriptSink,
): string | TrustedScriptURL;

declare global {
	interface Window {
		/** Shared with the pre-hydration stream runtime. Prefer setTrustedTypesPolicy(). */
		__RIPPLE_TRUSTED_TYPES__?: TrustedTypesPolicy | null;
	}
}
