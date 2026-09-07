// Module-level op handles + shared tree constants — the vue-vapor analogue of
// the sibling fixtures' module-level `_setRoot`/`_setLocal`/`_setVisible`
// variables. Components register closures at setup time (vapor bodies run
// once; the closures stay valid for the app lifetime), and main.js wires the
// exported ops to the window.__* hooks the harness drives. Injection keys are
// symbols so the provide/inject pairs can't collide.

export const D = 10;
export const M = 5;
export const MID_PATH = 'L'.repeat(M);

export const RootKey = Symbol('root');
export const LocalKey = Symbol('local');

let _bumpRoot = null;
let _bumpLocal = null;
let _setVisible = null;

export function bindRoot(fn) {
	_bumpRoot = fn;
}
export function bindLocal(fn) {
	_bumpLocal = fn;
}
export function bindVisible(fn) {
	_setVisible = fn;
}

export function bumpRoot() {
	if (_bumpRoot) _bumpRoot();
}
export function bumpPartial() {
	if (_bumpLocal) _bumpLocal();
}
export function hideMid() {
	if (_setVisible) _setVisible(false);
}
export function showMid() {
	if (_setVisible) _setVisible(true);
}
