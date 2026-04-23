export component DocsHeader() {
	<header class="Header">
		<div class="HeaderBar has-sidebar">
			<div class="wrapper">
				<div class="container">
					<div class="title">
						<div class="HeaderBarTitle has-sidebar">
							<a class="title" href="/" target="_self">
								<img
									class="Image logo"
									src="/images/ripple-logo-horizontal.png"
									alt="Ripple Logo"
								/>
							</a>
						</div>
					</div>
					<div class="content">
						<div class="content-body">
							<div class="HeaderBarSearch search">
								<button type="button" class="DocSearch DocSearch-Button">
									<span class="DocSearch-Button-Container">
										<svg class="DocSearch-Search-Icon" width="20" height="20" viewBox="0 0 20 20">
											<path
												d="M14.386 14.386l4.0877 4.0877-4.0877-4.0877c-2.9418 2.9419-7.7115 2.9419-10.6533 0-2.9419-2.9418-2.9419-7.7115 0-10.6533 2.9418-2.9419 7.7115-2.9419 10.6533 0 2.9419 2.9418 2.9419 7.7115 0 10.6533z"
												stroke="currentColor"
												fill="none"
												fill-rule="evenodd"
												stroke-linecap="round"
												stroke-linejoin="round"
											/>
										</svg>
										<span class="DocSearch-Button-Placeholder">{'Search'}</span>
									</span>
									<span class="DocSearch-Button-Keys">
										<kbd class="DocSearch-Button-Key">{'⌘'}</kbd>
										<kbd class="DocSearch-Button-Key">{'K'}</kbd>
									</span>
								</button>
							</div>
							<nav aria-labelledby="main-nav-aria-label" class="HeaderBarMenu menu">
								<span id="main-nav-aria-label" class="visually-hidden">{'Main Navigation'}</span>
								<a class="link HeaderBarMenuLink" href="/llms.txt" target="_self" tabindex="0">
									<span>{'llms.txt'}</span>
								</a>
								<a class="link HeaderBarMenuLink" href="/playground" tabindex="0">
									<span>{'Playground'}</span>
								</a>
								<a class="link HeaderBarMenuLink active" href="/docs/introduction" tabindex="0">
									<span>{'Docs'}</span>
								</a>
							</nav>
							<div class="HeaderBarAppearance appearance">
								<button
									class="Switch SwitchAppearance"
									type="button"
									role="switch"
									aria-checked="false"
								>
									<span class="check">
										<span class="icon">
											<svg class="sun" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
												<circle cx="12" cy="12" r="4" fill="currentColor" />
												<path
													fill="currentColor"
													d="M12 2v2m0 16v2M4 12H2m20 0h-2m-2.05-5.95L16.24 7.76m-8.48 8.48-1.41 1.41m0-11.31 1.41 1.42m8.48 8.48 1.41 1.41"
												/>
											</svg>
											<svg class="moon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
												<path
													fill="currentColor"
													d="M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 0 1-4.4 2.26 5.403 5.403 0 0 1-3.14-9.8c-.44-.06-.9-.1-1.36-.1z"
												/>
											</svg>
										</span>
									</span>
								</button>
							</div>
							<div class="SocialLinks HeaderBarSocialLinks social-links">
								<a
									class="SocialLink no-icon"
									href="https://github.com/Ripple-TS/ripple"
									aria-label="github"
									target="_blank"
									rel="me noopener"
								>
									<svg viewBox="0 0 24 24" class="social-icon">
										<path
											fill="currentColor"
											d="M12 2C6.475 2 2 6.475 2 12a9.994 9.994 0 0 0 6.838 9.488c.5.087.687-.213.687-.476 0-.237-.013-1.024-.013-1.862-2.512.463-3.162-.612-3.362-1.175-.113-.288-.6-1.175-1.025-1.413-.35-.187-.85-.65-.013-.662.788-.013 1.35.725 1.538 1.025.9 1.512 2.338 1.087 2.912.825.088-.65.35-1.087.638-1.337-2.225-.25-4.55-1.113-4.55-4.938 0-1.088.387-1.987 1.025-2.688-.1-.25-.45-1.275.1-2.65 0 0 .837-.262 2.75 1.026a9.28 9.28 0 0 1 2.5-.338c.85 0 1.7.112 2.5.337 1.912-1.3 2.75-1.024 2.75-1.024.55 1.375.2 2.4.1 2.65.637.7 1.025 1.587 1.025 2.687 0 3.838-2.337 4.688-4.562 4.938.362.312.675.912.675 1.85 0 1.337-.013 2.412-.013 2.75 0 .262.188.574.688.474A10.016 10.016 0 0 0 22 12c0-5.525-4.475-10-10-10z"
										/>
									</svg>
								</a>
								<a
									class="SocialLink no-icon"
									href="https://discord.gg/JBF2ySrh2W"
									aria-label="discord"
									target="_blank"
									rel="me noopener"
								>
									<svg viewBox="0 0 24 24" class="social-icon">
										<path
											fill="currentColor"
											d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"
										/>
									</svg>
								</a>
							</div>
						</div>
					</div>
				</div>
			</div>
			<div class="divider">
				<div class="divider-line" style="width: 100%; height: 1px; background-color: #000;" />
			</div>
		</div>
	</header>

	<style>
		.Header {
			position: fixed;
			top: 0;
			left: 0;
			right: 0;
			z-index: 100;
		}

		.HeaderBar {
			position: relative;
			height: 64px;
			pointer-events: none;
			white-space: nowrap;
			background-color: #1b1b1f;
		}

		.wrapper {
			padding: 0 32px;
		}

		.HeaderBar.has-sidebar .wrapper {
			padding: 0;
		}

		.container {
			display: flex;
			justify-content: space-between;
			margin: 0 auto;
			max-width: 100%;
			height: 64px;
			pointer-events: none;
		}

		.container > .title,
		.container > .content {
			pointer-events: none;
		}

		.container > .title {
			flex-shrink: 0;
			height: 63px;
			transition: background-color 0.5s;
		}

		@media (min-width: 960px) {
			.HeaderBar.has-sidebar .container > .title {
				position: absolute;
				top: 0;
				left: 0;
				z-index: 2;
				padding: 0 32px;
				width: 272px;
				height: 64px;
				background-color: #161618;
			}
		}

		@media (min-width: 1440px) {
			.HeaderBar.has-sidebar .container > .title {
				padding-left: max(32px, calc((100vw - 1376px) / 2));
				width: calc((100vw - 1376px) / 2 + 272px - 32px);
			}
		}

		.HeaderBarTitle {
			display: flex;
			align-items: center;
			width: 100%;
			height: 64px;
		}

		.HeaderBarTitle.has-sidebar {
			border-bottom: 1px solid #2e2e32;
		}

		.HeaderBarTitle .title {
			display: flex;
			align-items: center;
			border-bottom: 1px solid transparent;
			width: 100%;
			height: 64px;
			font-size: 16px;
			font-weight: 600;
			color: rgba(255, 255, 245, 0.86);
			transition: opacity 0.25s;
			pointer-events: auto;
		}

		.HeaderBarTitle.has-sidebar .title {
			border-bottom-color: #2e2e32;
		}

		.Image.logo {
			height: 32px;
			width: auto;
		}

		.content {
			flex-grow: 1;
		}

		.HeaderBar.has-sidebar .content {
			position: relative;
			z-index: 1;
			padding-left: 272px;
		}

		.HeaderBar.has-sidebar .content-body {
			padding-right: 32px;
		}

		@media (min-width: 1440px) {
			.HeaderBar.has-sidebar .content {
				padding-left: calc((100vw - 1440px) / 2 + 272px);
			}

			.HeaderBar.has-sidebar .content-body {
				padding-right: calc((100vw - 1440px) / 2 + 32px);
			}
		}

		.content-body {
			display: flex;
			justify-content: flex-end;
			align-items: center;
			height: 64px;
			background-color: #1b1b1f;
			pointer-events: auto;
		}

		.visually-hidden {
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

		.HeaderBarSearch.search {
			flex-grow: 1;
			padding-left: 32px;
		}

		.DocSearch-Button {
			display: flex;
			align-items: center;
			gap: 8px;
			padding: 0 12px;
			height: 40px;
			background: #161618;
			border: 1px solid transparent;
			border-radius: 8px;
			cursor: pointer;
			color: #98989f;
			font-size: 14px;
			font-weight: 500;
			transition: border-color 0.25s;
		}

		.DocSearch-Button:hover {
			border-color: #3e95ff;
		}

		.DocSearch-Button-Container {
			display: flex;
			align-items: center;
			gap: 8px;
		}

		.DocSearch-Search-Icon {
			width: 16px;
			height: 16px;
			flex-shrink: 0;
		}

		.DocSearch-Button-Placeholder {
			font-size: 14px;
			font-weight: 500;
		}

		.DocSearch-Button-Keys {
			display: flex;
			align-items: center;
			gap: 4px;
			min-width: auto;
			padding: 0;
		}

		.DocSearch-Button-Key {
			font-size: 12px;
			font-weight: 500;
			color: #98989f;
			background: none;
			border: none;
			box-shadow: none;
			padding: 0;
			min-width: auto;
		}

		.HeaderBarMenu.menu {
			display: flex;
			align-items: center;
			pointer-events: auto;
		}

		.HeaderBarMenuLink {
			display: flex;
			align-items: center;
			padding: 0 12px;
			line-height: 64px;
			font-size: 14px;
			font-weight: 500;
			color: rgba(255, 255, 245, 0.86);
			transition: color 0.25s;
		}

		.HeaderBarMenuLink:hover,
		.HeaderBarMenuLink.active {
			color: #3e95ff;
		}

		.menu + .appearance::before {
			display: flex;
			margin-right: 16px;
			margin-left: 8px;
			width: 1px;
			height: 24px;
			background-color: #2e2e32;
			content: '';
		}

		.HeaderBarAppearance.appearance {
			display: flex;
			align-items: center;
		}

		.Switch.SwitchAppearance {
			display: flex;
			align-items: center;
			justify-content: center;
			width: 40px;
			height: 22px;
			background: #2e2e32;
			border: none;
			border-radius: 11px;
			cursor: pointer;
			transition: background-color 0.25s;
		}

		.Switch .check {
			position: relative;
			width: 36px;
			height: 18px;
			border-radius: 9px;
		}

		.Switch .icon {
			position: absolute;
			top: 1px;
			left: 1px;
			width: 16px;
			height: 16px;
			border-radius: 50%;
			background-color: #1b1b1f;
			display: flex;
			align-items: center;
			justify-content: center;
			transition: transform 0.25s;
		}

		.Switch .sun {
			display: none;
		}

		.Switch .moon {
			width: 12px;
			height: 12px;
			color: rgba(255, 255, 245, 0.86);
		}

		.appearance + .social-links::before {
			display: flex;
			margin-right: 8px;
			margin-left: 16px;
			width: 1px;
			height: 24px;
			background-color: #2e2e32;
			content: '';
		}

		.SocialLinks.social-links {
			display: flex;
			align-items: center;
			margin-right: -8px;
		}

		.SocialLink {
			display: flex;
			align-items: center;
			justify-content: center;
			width: 36px;
			height: 36px;
			color: rgba(255, 255, 245, 0.86);
			transition: color 0.25s;
		}

		.SocialLink:hover {
			color: #3e95ff;
		}

		.social-icon {
			width: 20px;
			height: 20px;
		}

		:global(.divider) {
			width: 100%;
			height: 1px;
			background-color: #1b1b1f;
		}

		:global(.HeaderBar.has-sidebar .divider) {
			padding-left: 272px;
		}

		@media (min-width: 1440px) {
			:global(.HeaderBar.has-sidebar .divider) {
				padding-left: calc((100vw - 1440px) / 2 + 272px);
			}
		}

		:global(.divider-line) {
			width: 100%;
			height: 1px;
			background-color: #2e2e32;
		}

		@media (max-width: 960px) {
			.HeaderBar.has-sidebar .title {
				position: static;
				width: auto;
				padding: 0 24px;
				background: transparent;
			}

			.HeaderBarTitle.has-sidebar {
				border-bottom: none;
			}

			.HeaderBarTitle.has-sidebar .title {
				border-bottom-color: transparent;
			}

			.HeaderBar.has-sidebar .content {
				padding-left: 0;
			}

			.HeaderBar.has-sidebar .divider {
				padding-left: 0;
			}

			.HeaderBarMenu.menu {
				display: none;
			}
		}

		@media (max-width: 768px) {
			.DocSearch-Button-Placeholder,
			.DocSearch-Button-Keys {
				display: none;
			}
		}
	</style>
}
