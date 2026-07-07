/**
 * Inline client runtime for streaming SSR, emitted once at the end of the
 * shell chunk (only when the shell contains unresolved flush-unit slots).
 *
 * Exposes two globals:
 * - `__TSRX_B__`: registry shared with the hydrating app. Before a unit's
 *   chunk arrives, the app may register `{ a(template, errored) }` for a slot
 *   it hydrated in the pending state; after a swap the runtime stores `1` to
 *   mark the slot done.
 * - `__TSRX_S__(id, errored)`: called by each streamed chunk. Moves streamed
 *   head content into `<head>`, then either hands the chunk template to the
 *   registered boundary (post-hydration arrival) or swaps the fallback DOM
 *   directly (pre-hydration arrival) and normalizes the slot markers so the
 *   result is byte-identical to non-streamed SSR output.
 *
 * The source of truth for marker shapes is `src/constants.js`
 * (HYDRATION_START_PENDING / HYDRATION_START_ERRORED / STREAM_*_ATTR); this
 * script is hand-minified against those values.
 */
export const STREAM_RUNTIME_SCRIPT =
	'<script>(function(){var d=document;var B=window.__TSRX_B__||(window.__TSRX_B__={});' +
	'window.__TSRX_S__=function(n,e){' +
	"var h=d.querySelector('template[data-tsrx-head=\"'+n+'\"]');" +
	'if(h){d.head.appendChild(h.content);h.remove();}' +
	"var t=d.querySelector('template[data-tsrx-chunk=\"'+n+'\"]');" +
	'var r=B[n];' +
	'if(r&&r.a){B[n]=1;r.a(t,e);if(t)t.remove();return;}' +
	'var w=d.createTreeWalker(d.body||d.documentElement,128),c;' +
	'while((c=w.nextNode())){if(c.data==="[?"+n)break;}' +
	'if(!c){B[n]=1;if(t)t.remove();return;}' +
	'var x=0,m=c.nextSibling,z=null,q;' +
	'while(m){if(m.nodeType===8){var s=m.data;if(s==="]"){if(x===0){z=m;break;}x--;}else if(s.charCodeAt(0)===91){x++;}}m=m.nextSibling;}' +
	'if(!z){B[n]=1;if(t)t.remove();return;}' +
	'm=c.nextSibling;' +
	'while(m!==z){q=m;m=m.nextSibling;q.remove();}' +
	'if(e){c.data="[!"+n;}' +
	'else{z.before(t.content);c.remove();z.remove();}' +
	'if(t)t.remove();B[n]=1;};})();</script>';
