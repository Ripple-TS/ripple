import type { JSX } from 'ripple';
import {
	setTrustedTypesPolicy,
	type TrustedHTML,
	type TrustedScript,
	type TrustedScriptURL,
} from 'ripple/csp';
import type { TrustedTypePolicy } from 'trusted-types/lib';

declare const policy: TrustedTypePolicy;
declare const html: TrustedHTML;
declare const script: TrustedScript;
declare const url: TrustedScriptURL;
setTrustedTypesPolicy(policy);
const div: JSX.IntrinsicElements['div'] = { innerHTML: html };
const scriptElement: JSX.IntrinsicElements['script'] = { innerHTML: script, src: url };
// @ts-expect-error Script trust must not authorize arbitrary HTML.
const invalid: JSX.IntrinsicElements['div'] = { innerHTML: script };
void [div, scriptElement, invalid];
