// A theme module shared by the scoped-style tests: `base` is applied by
// `theme`, so `theme.$class` carries both hashes and `theme` keeps every
// selector (it is exported).
export const base = <style>
	article {
		font-family: system-ui;
	}
	.muted {
		color: gray;
	}
</style>;

export const theme = <style apply={base}>
	article {
		color: green;
	}
	.dark {
		color: purple;
	}
</style>;
