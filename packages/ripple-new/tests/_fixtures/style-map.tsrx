import { useState } from 'ripple-new';

// Style map: a `<style>` element assigned to a `const` becomes a compile-
// time object whose keys are the source class names and whose values are
// the hashed class strings (e.g. `"red tsrx-abc"`). The map is used as a
// lookup at the call site: `<div class={styles.red}/>` ships a class
// attribute containing exactly the hashed selector the rules target.
//
// The stylesheet ALSO gets registered for module-level injection, so the
// rules end up in a `<style data-ripple-new>` tag and apply to anyone
// who renders with the hashed class.

const styles = <style>
	.red {
		color: rgb(200, 0, 0);
	}
	.blue {
		color: rgb(0, 0, 200);
	}
	.pad {
		padding: 5px;
	}
</style>;

export function Picker(props) @{
	<div class={styles[props.kind]}>
		{'I am ' + props.kind as string}
	</div>
}

export function Composed() @{
	// Multiple map lookups concatenated into one class attribute.
	<div class={styles.red + ' ' + styles.pad}>{'red + padded'}</div>
}

// Toggled map lookup based on state — verifies the runtime updates
// `class` when the key changes.
export function Switchable() @{
	const [on, setOn] = useState(false);
	<button class={on ? styles.blue : styles.red} onClick={() => setOn(!on)}>
		{(on ? 'blue' : 'red') as string}
	</button>
}

// Style map exported from the module — proves the `export const x = <style>...</style>`
// shape also compiles. Other files can `import { palette } from './style-map'`.
export const palette = <style>
	.accent {
		color: rgb(255, 165, 0);
	}
</style>;

export function Branded() @{
	<span class={palette.accent}>{'branded'}</span>
}
