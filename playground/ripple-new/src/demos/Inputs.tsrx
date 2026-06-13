import { useState } from 'ripple-new';

// Controlled inputs + derived display + @switch lowering for the kind picker.
// Mixes input event handling with a discriminant-driven render.
export function Inputs() @{
	const [name, setName] = useState('world');
	const [kind, setKind] = useState('plain');

	<div>
		<h2 class="demo-title">{'Inputs + @switch'}</h2>
		<p
			class="demo-blurb"
		>{'Controlled <input> + a @switch over the kind discriminant. Each case is its own block boundary.'}</p>
		<div class="row">
			<input class="txt" value={name} onInput={(e) => setName(e.target.value)} />
			<select class="txt" value={kind} onChange={(e) => setKind(e.target.value)}>
				<option value="plain">{'plain'}</option>
				<option value="shout">{'SHOUT'}</option>
				<option value="whisper">{'whisper'}</option>
			</select>
		</div>
		<div class="panel" style="margin-top: 12px">
			@switch (kind) {
				@case 'plain': {
					<p style="margin: 0">
						{'hello, ' + name as string}
					</p>
				}
				@case 'shout': {
					<p style="margin: 0; font-weight: 700">
						{'HELLO, ' + name.toUpperCase() + '!' as string}
					</p>
				}
				@case 'whisper': {
					<p style="margin: 0; color: var(--muted); font-style: italic">
						{'hello, ' + name.toLowerCase() + '...' as string}
					</p>
				}
				@default: {
					<p style="margin: 0">{'(unknown kind)'}</p>
				}
			}
		</div>
	</div>
}
