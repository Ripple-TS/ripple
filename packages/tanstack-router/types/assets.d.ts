import type { Children, Derived, TSRXElement } from 'ripple';
import type { AssetCrossOriginConfig, RouterManagedTag } from '@tanstack/router-core';
export declare function HeadContent(props?: {
	assetCrossOrigin?: AssetCrossOriginConfig;
}): TSRXElement;
export declare function Scripts(): TSRXElement;
export declare function Asset(props: RouterManagedTag): TSRXElement;
export declare function useHydrated(): Derived<boolean>;
export declare function ClientOnly(props: {
	children?: Children;
	fallback?: Children;
}): TSRXElement;
