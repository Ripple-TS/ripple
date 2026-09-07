// Shared op driver for the portal-swarm bench — framework-agnostic. Each
// section component (A / B / B_stable) binds its state setters on mount;
// main.js wires the exported ops to the window.__* hooks the harness drives.
// Tick counters live here at module scope so the timed rerender ops are pure
// set-calls (no updater-fn API dependence across frameworks). Copied verbatim
// into each app's src/.

let A = null;
let B = null;
let BS = null;
let tickA = 0;
let tickB = 0;
let tickBS = 0;

export function bindA(setOpen, setTick, setDistinct) {
	A = { setOpen, setTick, setDistinct };
}
export function bindB(setOpen, setTick, setDistinct) {
	B = { setOpen, setTick, setDistinct };
}
export function bindBS(setOpen, setTick, setDistinct) {
	BS = { setOpen, setTick, setDistinct };
}

export function openA() {
	A.setOpen(true);
}
export function closeA() {
	A.setOpen(false);
}
export function openB() {
	B.setOpen(true);
}
export function closeB() {
	B.setOpen(false);
}
export function openBS() {
	BS.setOpen(true);
}
export function closeBS() {
	BS.setOpen(false);
}
export function openAll() {
	openA();
	openB();
	openBS();
}
export function closeAll() {
	closeA();
	closeB();
	closeBS();
}

// Bump a section's UNRELATED tick state (rendered in the section header) while
// its 200 portals are open — the portal re-render + restamp path.
export function rerenderA() {
	A.setTick(++tickA);
}
export function rerenderB() {
	B.setTick(++tickB);
}
export function rerenderBS() {
	BS.setTick(++tickBS);
}

// Flip ALL sections between the shared document.body target and the 200
// per-item container divs. Only ever called while all portals are closed, so
// portals never migrate targets mid-flight — they mount fresh on the next open.
export function setDistinct(on) {
	A.setDistinct(on);
	B.setDistinct(on);
	BS.setDistinct(on);
}
