declare var container: HTMLDivElement;
declare var error: string | undefined;
declare function render(component: () => void): void;

// Helper type for test attributes that allows custom data-* and other attributes
type TestAttributes = Record<string, any>;

type TagNameMap = HTMLElementTagNameMap & SVGElementTagNameMap;

interface HTMLElement {
	// We don't care about checking if it returned an element or null in tests
	// because if it returned null, those tests will fail anyway. This
	// typing drastically simplifies testing: you don't have to check if the
	// query returned null or an actual element, and you don't have to do
	// optional chaining everywhere (elem?.textContent)
	querySelector<K extends keyof TagNameMap>(selectors: K): TagNameMap[K];
	querySelector(selectors: string): HTMLElement;
	querySelectorAll<K extends keyof TagNameMap>(
		selectors: K,
	): NodeListOf<TagNameMap[K]>;
	querySelectorAll(selectors: string): NodeListOf<Element>;

	// Allow dynamic properties for delegated event handlers
	[key: string]: any;
}
