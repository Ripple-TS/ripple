import { Activity, track } from 'ripple';

describe('Activity SSR', () => {
	it('renders visible children by default and reads tracked modes', async () => {
		function App() @{
			const mode = track<'hidden' | 'visible'>('hidden');
			<>
				<Activity>
					<b>visible</b>
				</Activity>
				<Activity {mode}>
					<p>hidden</p>
				</Activity>
			</>
		}
		const { body } = await render(App);
		const { document } = parseHtml(body);
		expect(document.querySelector('b')!.getAttribute('style')).toBeNull();
		expect(document.querySelector('p')!.getAttribute('style')).toBe('display:none!important');
		expect(body).toContain('<!--[a-->');
	});

	it('keeps attributes, text, raw content, SVG and table markup intact', async () => {
		const title = 'fake style="bad" >';
		function App() @{
			<>
				<Activity mode="hidden">
					{'text < & -->'}
					<div title={title} style="color:red;display:grid!important">content</div>
					<textarea>{'a < b'}</textarea>
				</Activity>
				<svg>
					<Activity mode="hidden">
						<circle r="2" />
					</Activity>
				</svg>
				<table>
					<tbody>
						<Activity mode="hidden">
							<tr>
								<td>cell</td>
							</tr>
						</Activity>
					</tbody>
				</table>
			</>
		}
		const { body } = await render(App);
		const { document } = parseHtml(body);
		expect(document.querySelector('div')!.getAttribute('title')).toBe('fake style="bad" >');
		expect(document.querySelector('div')!.getAttribute('data-ripple-activity-style')).toBe(
			'color:red;display:grid!important',
		);
		expect(body).toContain('a &lt; b</textarea>');
		expect(document.querySelector('tbody')!.children[0].tagName).toBe('TR');
		expect(document.querySelector('circle')!.getAttribute('style')).toBe('display:none!important');
		expect(body).not.toContain('text &lt;');
	});
});

it('uses the compact rt marker for hidden top-level text', async () => {
	function App() @{
		<Activity mode="hidden">{'text < & -->'}</Activity>
	}
	const { body } = await render(App);
	expect(body).toContain('<!--rt:');
	expect(body).not.toContain('ripple-text:');
});
