<script>
	let { id, title, onclick } = $props();
</script>

<div class="col-sm-6 smallpad">
	<button type="button" class="btn btn-primary btn-block" {id} {onclick}>{title}</button>
</div>
