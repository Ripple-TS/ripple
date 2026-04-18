export component Header() {
	<h1 class="sr-only">{'Ripple'}</h1>
	<img
		src="/images/ripple-logo-horizontal.png"
		alt="Ripple Logo"
		class="logo"
		fetchpriority="high"
	/>
	<p class="subtitle">{'the elegant TypeScript UI framework'}</p>

	<style>
		.logo {
			width: 100%;
			max-width: 400px;
			aspect-ratio: 800 / 217;
			margin: 20px auto;
			filter: drop-shadow(0 0 30px rgba(120, 219, 226, 0.6))
				drop-shadow(0 0 60px rgba(255, 119, 198, 0.6))
				drop-shadow(0 0 90px rgba(120, 119, 198, 0.4));
			animation: glowFadeOut 3s ease-in-out forwards;
		}

		.sr-only {
			position: absolute;
			width: 1px;
			height: 1px;
			padding: 0;
			margin: -1px;
			overflow: hidden;
			clip: rect(0, 0, 0, 0);
			white-space: nowrap;
			border-width: 0;
		}

		.subtitle {
			font-size: 1.25rem;
			font-weight: 400;
			margin-bottom: 3rem;
			opacity: 0.8;
			line-height: 1.6;
			font-variation-settings: 'CASL' 0.5;
			color: rgba(255, 255, 255, 0.8);
			text-shadow: 0 0 20px rgba(120, 219, 226, 0.2);
		}

		@media (max-width: 768px) {
			h1 {
				font-size: 2.5rem;
			}

			.subtitle {
				font-size: 1.1rem;
			}
		}
	</style>
}
