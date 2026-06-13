import { useState, use } from 'ripple-new';

// @try / @pending / @catch — ripple-new's TSRX-flavored suspense surface.
// Clicking "fetch" starts a fake async request that the body await's via
// use(). While pending, the @pending body renders. On reject, the @catch
// branch surfaces the error and offers reset(). Reset clears the slot
// state and re-runs the try body with fresh deps.

function delay(ms, value, shouldFail) {
	return new Promise((resolve, reject) => {
		setTimeout(() => {
			if (shouldFail) reject(new Error('simulated fetch failure'));
			else resolve(value);
		}, ms);
	});
}

function FetchedQuote(props) @{
	// use() suspends the boundary until the promise resolves; cached on retry.
	const quote = use(props.promise);
	<p style="margin: 0; font-size: 14px">
		{'"' + quote + '"' as string}
	</p>
}

export function SuspenseDemo() @{
	const [token, setToken] = useState(0);
	const [shouldFail, setShouldFail] = useState(false);

	const promise = delay(800, 'shipping is the feature', shouldFail);

	<div>
		<h2 class="demo-title">{'Suspense via @try / @pending / @catch'}</h2>
		<p
			class="demo-blurb"
		>{'Click fetch to suspend on a fake promise. Toggle failure to route into the catch branch with reset().'}</p>
		<div class="row">
			<button class="btn" onClick={() => setToken((t) => t + 1)}>
				{'fetch ' + token + 1 as string}
			</button>
			<label class="row" style="gap: 4px">
				<input
					type="checkbox"
					checked={shouldFail}
					onChange={(e) => setShouldFail(e.target.checked)}
				/>
				<span>{'simulate failure'}</span>
			</label>
		</div>
		<div class="panel" style="margin-top: 12px">
			@try {
				<FetchedQuote promise={promise} />
			} @pending {
				<p style="margin: 0; color: var(--muted)">{'loading...'}</p>
			} @catch (err, reset) {
				<>
					<pre class="boom">
						{err.message as string}
					</pre>
					<button
						class="btn"
						onClick={() => {
							reset();
							setShouldFail(false);
						}}
					>{'reset + clear failure'}</button>
				</>
			}
		</div>
	</div>
}
