<script>
	import { flushSync } from 'svelte';
	import Button from './Button.svelte';
	import Row from './Row.svelte';

	const A = [
		'pretty',
		'large',
		'big',
		'small',
		'tall',
		'short',
		'long',
		'handsome',
		'plain',
		'quaint',
		'clean',
		'elegant',
		'easy',
		'angry',
		'crazy',
		'helpful',
		'mushy',
		'odd',
		'unsightly',
		'adorable',
		'important',
		'inexpensive',
		'cheap',
		'expensive',
		'fancy',
	];
	const C = [
		'red',
		'yellow',
		'blue',
		'green',
		'pink',
		'brown',
		'purple',
		'brown',
		'white',
		'black',
		'orange',
	];
	const N = [
		'table',
		'chair',
		'house',
		'bbq',
		'desk',
		'car',
		'pony',
		'cookie',
		'sandwich',
		'burger',
		'pizza',
		'mouse',
		'keyboard',
	];

	let nextId = 1;
	const random = (max) => Math.round(Math.random() * 1000) % max;

	function buildData(count) {
		const data = new Array(count);
		for (let i = 0; i < count; i++) {
			data[i] = {
				id: nextId++,
				label: `${A[random(A.length)]} ${C[random(C.length)]} ${N[random(N.length)]}`,
			};
		}
		return data;
	}

	function mulberry32(seed) {
		return () => {
			seed |= 0;
			seed = (seed + 0x6d2b79f5) | 0;
			let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
			t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
			return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
		};
	}
	const shuffleSeeds = mulberry32(42);
	const nextShuffleSeed = () => (shuffleSeeds() * 4294967296) >>> 0;
	function shuffleWithSeed(data, seed) {
		const rand = mulberry32(seed);
		const out = data.slice();
		for (let i = out.length - 1; i > 0; i--) {
			const j = (rand() * (i + 1)) | 0;
			const tmp = out[i];
			out[i] = out[j];
			out[j] = tmp;
		}
		return out;
	}

	let rows = $state.raw([]);
	let selected = $state(0);

	function commit(update, nextSelected = selected) {
		flushSync(() => {
			rows = typeof update === 'function' ? update(rows) : update;
			selected = nextSelected;
		});
	}
	const run = () => commit(buildData(1000), 0);
	const runLots = () => commit(buildData(10000), 0);
	const add = () => commit((data) => data.concat(buildData(1000)));
	const update = () =>
		commit((data) => {
			const out = data.slice();
			for (let i = 0; i < out.length; i += 10) {
				const row = out[i];
				out[i] = { id: row.id, label: row.label + ' !!!' };
			}
			return out;
		});
	const clear = () => commit([], 0);
	const swapRows = () =>
		commit((data) => {
			if (data.length <= 998) return data;
			const out = data.slice();
			const tmp = out[1];
			out[1] = out[998];
			out[998] = tmp;
			return out;
		});
	const select = (id) => flushSync(() => (selected = id));
	const remove = (id) => commit((data) => data.filter((row) => row.id !== id));
	const reverse = () => commit((data) => data.toReversed());
	const shuffle = () => {
		const seed = nextShuffleSeed();
		commit((data) => shuffleWithSeed(data, seed));
	};
	const rotateForward = () =>
		commit((data) => (data.length ? [data[data.length - 1], ...data.slice(0, -1)] : data));
	const rotateBackward = () => commit((data) => (data.length ? [...data.slice(1), data[0]] : data));
	const prepend100 = () => commit((data) => buildData(100).concat(data));
	const append100 = () => commit((data) => data.concat(buildData(100)));
	const insertMid100 = () =>
		commit((data) => {
			const mid = data.length >> 1;
			return data.slice(0, mid).concat(buildData(100), data.slice(mid));
		});
	const removeFirst = () => commit((data) => data.slice(1));
	const removeEvery10 = () => commit((data) => data.filter((_, index) => index % 10 !== 0));
	const displace = (count) => commit((data) => data.slice(count).concat(data.slice(0, count)));
</script>

<div class="container">
	<div class="jumbotron">
		<div class="row">
			<div class="col-md-6"><h1>Svelte 5 keyed</h1></div>
			<div class="col-md-6">
				<div class="row">
					<Button id="run" title="Create 1,000 rows" onclick={run} />
					<Button id="runlots" title="Create 10,000 rows" onclick={runLots} />
					<Button id="add" title="Append 1,000 rows" onclick={add} />
					<Button id="update" title="Update every 10th row" onclick={update} />
					<Button id="clear" title="Clear" onclick={clear} />
					<Button id="swaprows" title="Swap Rows" onclick={swapRows} />
				</div>
				<div class="row">
					<Button id="reverse" title="Reverse rows" onclick={reverse} />
					<Button id="shuffle" title="Shuffle rows (seeded)" onclick={shuffle} />
					<Button id="rotatef" title="Rotate last to front" onclick={rotateForward} />
					<Button id="rotateb" title="Rotate first to end" onclick={rotateBackward} />
					<Button id="prepend100" title="Prepend 100 rows" onclick={prepend100} />
					<Button id="append100" title="Append 100 rows" onclick={append100} />
					<Button id="insertmid100" title="Insert 100 rows at middle" onclick={insertMid100} />
					<Button id="removefirst" title="Remove first row" onclick={removeFirst} />
					<Button id="removeevery10" title="Remove every 10th row" onclick={removeEvery10} />
					<Button id="displace3" title="Displace first 3 to end" onclick={() => displace(3)} />
					<Button id="displace4" title="Displace first 4 to end" onclick={() => displace(4)} />
					<Button id="displace5" title="Displace first 5 to end" onclick={() => displace(5)} />
					<Button id="displace6" title="Displace first 6 to end" onclick={() => displace(6)} />
					<Button id="displace8" title="Displace first 8 to end" onclick={() => displace(8)} />
				</div>
			</div>
		</div>
	</div>
	<table class="table table-hover table-striped test-data">
		<tbody>
			{#each rows as item (item.id)}
				<Row {item} selected={selected === item.id} {select} {remove} />
			{/each}
		</tbody>
	</table>
	<span class="preloadicon glyphicon glyphicon-remove" aria-hidden="true"></span>
</div>
