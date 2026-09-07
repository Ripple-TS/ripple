let updateRoot = null;
let updatePartial = null;
let updateVisible = null;

export function bindRoot(update) {
	updateRoot = update;
}
export function bindMid(updateLocal, setVisible) {
	updatePartial = updateLocal;
	updateVisible = setVisible;
}
export function bumpRoot() {
	updateRoot?.();
}
export function bumpPartial() {
	updatePartial?.();
}
export function hideMid() {
	updateVisible?.(false);
}
export function showMid() {
	updateVisible?.(true);
}
