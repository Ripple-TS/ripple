enum Stage {
	Ready = 2,
	Label = 'ready',
}

export function EnumValues() @{
	const values = [];
	for (let i = 0; i < 2; i++) {
		enum Stage {
			Value = i,
		}
		values.push(() => Stage.Value);
	}
	enum Local {
		First = 5,
		Second,
	}
	<>
		<span class="enum-number">{Stage.Ready}</span>
		<span class="enum-string">{Stage.Label}</span>
		<span class="enum-local">{Local.Second}</span>
		<span class="enum-scopes">{values.map((read) => read()).join(',')}</span>
	</>
}
