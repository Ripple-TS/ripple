export component BrandLogo() {
	<div class="brand-logo">
		<img class="logo-mark" src="/images/tsrx-mark.svg?v=4" alt="TSRX logo" aria-label="TSRX logo" />
	</div>

	<style>
		.brand-logo {
			position: relative;
			width: min(16rem, 54vw);
			margin-inline: auto;
		}

		.logo-mark {
			display: block;
			width: 100%;
			height: auto;
		}
	</style>
}
