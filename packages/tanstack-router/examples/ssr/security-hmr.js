export const status = 'before';
if (import.meta.hot) {
	import.meta.hot.accept((module) => {
		document.documentElement.dataset.hmrModule = module.status;
	});
}
