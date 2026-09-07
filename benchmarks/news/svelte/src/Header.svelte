<script>
	let dark = $state(false);
</script>

<header class={dark ? 'masthead dark' : 'masthead'}>
	<h1 class="logo">The Octane Times</h1>
	<button id="theme" class="theme" onclick={() => (dark = !dark)}>
		{dark ? 'Light mode' : 'Dark mode'}
	</button>
</header>
