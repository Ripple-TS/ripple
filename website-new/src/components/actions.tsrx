export component Actions({ playgroundVisible = false }: { playgroundVisible: boolean }) {
	<div class="social-links">
		<a
			href="https://github.com/Ripple-TS/ripple"
			class="github-link"
			target="_blank"
			rel="noopener noreferrer"
		>
			<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
				<path
					d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.30.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"
				/>
			</svg>
			{'GitHub'}
		</a>

		<a
			href="https://discord.gg/JBF2ySrh2W"
			class="discord-link"
			target="_blank"
			rel="noopener noreferrer"
		>
			<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
				<path
					d="M20.222 0c1.406 0 2.54 1.137 2.607 2.475V24l-2.677-2.273-1.47-1.338-1.604-1.398.67 2.205H3.71c-1.402 0-2.54-1.065-2.54-2.476V2.48C1.17 1.142 2.31.003 3.715.003h16.5L20.222 0zm-6.118 5.683h-.03l-.202.2c2.073.6 3.076 1.537 3.076 1.537-1.336-.668-2.54-1.002-3.744-1.137-.87-.135-1.74-.064-2.475 0h-.2c-.47 0-1.47.2-2.81.735-.467.203-.735.336-.735.336s1.002-1.002 3.21-1.537l-.135-.135s-1.672-.064-3.477 1.27c0 0-1.805 3.144-1.805 7.02 0 0 1 1.74 3.743 1.806 0 0 .4-.533.805-1.002-1.54-.4-2.172-1.27-2.172-1.27s.135.064.336.2h.06c.03 0 .044.015.06.03v.006c.016.016.03.03.06.03.33.136.66.27.93.4.466.202 1.065.403 1.8.536.93.135 1.996.2 3.21 0 .6-.135 1.2-.267 1.8-.535.39-.2.87-.4 1.397-.737 0 0-.6.936-2.205 1.27.33.466.795 1 .795 1 2.744-.06 3.81-1.8 3.87-1.726 0-3.87-1.815-7.02-1.815-7.02-1.635-1.214-3.165-1.26-3.435-1.26l.056-.02zm.168 4.413c.703 0 1.27.6 1.27 1.335 0 .74-.57 1.34-1.27 1.34-.7 0-1.27-.6-1.27-1.34.002-.74.573-1.338 1.27-1.335zm-4.543 0c.7 0 1.266.6 1.266 1.335 0 .74-.57 1.34-1.27 1.34-.7 0-1.27-.6-1.27-1.34 0-.74.57-1.335 1.27-1.335z"
				/>
			</svg>
			{'Discord'}
		</a>

		<a href="/docs/introduction" class="github-link">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="24"
				height="24"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				class="lucide lucide-book-text-icon lucide-book-text"
			>
				<path
					d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20"
				/>
				<path d="M8 11h8" />
				<path d="M8 7h6" />
			</svg>
			{'Docs'}
		</a>

		if (playgroundVisible) {
			<a href="/playground" class="discord-link">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="24"
					height="24"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					class="lucide lucide-play-icon lucide-play"
				>
					<path
						d="M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z"
					/>
				</svg>
				{'Playground'}
			</a>
		}
	</div>

	<style>
		.github-link {
			color: rgba(255, 255, 255, 0.7);
			text-decoration: none;
			font-weight: 500;
			transition: all 0.3s ease;
			display: inline-flex;
			align-items: center;
			gap: 0.5rem;
			padding: 0.75rem 1.5rem;
			border: 1px solid rgba(120, 219, 226, 0.3);
			border-radius: 50px;
			background: rgba(0, 0, 0, 0.32);
			margin-bottom: 1rem;
			box-sizing: border-box;
			line-height: 1.2;
			font-size: 1rem;
			height: 48px;
		}

		.github-link:hover {
			color: white;
			transform: translateY(-2px);
			border-color: rgba(120, 219, 226, 0.6);
			box-shadow: 0 10px 30px rgba(120, 219, 226, 0.2);
			background: rgba(120, 219, 226, 0.1);
		}

		.github-link svg {
			width: 20px;
			height: 20px;
			fill: currentColor;
		}

		.social-links {
			display: flex;
			gap: 1rem;
			justify-content: center;
			margin-bottom: 1rem;
			align-items: baseline;
		}

		.discord-link {
			color: rgba(255, 255, 255, 0.7);
			text-decoration: none;
			font-weight: 500;
			transition: all 0.3s ease;
			display: inline-flex;
			align-items: center;
			gap: 0.5rem;
			padding: 0.75rem 1.5rem;
			border: 1px solid rgba(120, 219, 226, 0.3);
			border-radius: 50px;
			background: rgba(0, 0, 0, 0.32);
			box-sizing: border-box;
			line-height: 1.2;
			font-size: 1rem;
			height: 48px;
		}

		.discord-link:hover {
			color: white;
			transform: translateY(-2px);
			border-color: rgba(120, 219, 226, 0.6);
			box-shadow: 0 10px 30px rgba(120, 219, 226, 0.2);
			background: rgba(120, 219, 226, 0.1);
		}

		.discord-link svg {
			width: 20px;
			height: 20px;
			fill: currentColor;
		}
	</style>
}
