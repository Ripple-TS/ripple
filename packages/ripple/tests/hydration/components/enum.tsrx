enum Stage {
	Ready = 2,
	Label = 'ready',
}

export function EnumValues() @{
	enum Local {
		First = 5,
		Second,
	}
	<>
		<span class="enum-number">{Stage.Ready}</span>
		<span class="enum-string">{Stage.Label}</span>
		<span class="enum-local">{Local.Second}</span>
	</>
}
