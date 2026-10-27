import { Fragment, effect, track, type Children } from 'ripple';
import {
	composeSsrBodyScripts,
	getSsrBodyScriptParts,
	type RouterManagedTag,
	type AssetCrossOriginConfig,
} from '@tanstack/router-core';
import { isServer } from '@tanstack/router-core/isServer';
import { useRouter } from './hooks.js';
import { useTags } from './head.tsrx';
import {
	acquireAsset,
	assetKey,
	isDataScript,
	renderAsset,
	scriptAttributes,
	uniqueAssets,
} from './assets.js';

export function Asset(asset: RouterManagedTag & { head?: boolean }) @{
	asset = asset.tag === 'script' ? { ...asset, attrs: scriptAttributes(asset.attrs) } : asset;
	const router = useRouter();
	const server = isServer ?? router.isServer;
	const dataScript = !asset.head && asset.tag === 'script' && isDataScript(asset.attrs?.type);
	if (!server && !dataScript) effect(() => acquireAsset(asset));
	@if (dataScript) {
		// Route-defined MIME types and attribute spreads cannot be classified
		// statically; the runtime guard above admits only inert data scripts.
		<{'script'} {...asset.attrs} innerHTML={asset.children ?? ''} />
	} @else if (server) {
		<head>
			<Fragment innerHTML={renderAsset(asset, true)} />
		</head>
	}
}

export function HeadContent({ assetCrossOrigin }: { assetCrossOrigin?: AssetCrossOriginConfig }) @{
	const source = useTags(assetCrossOrigin);
	const tags = track(() => uniqueAssets(source.value));
	@for (const tag of tags.value; key assetKey(tag)) {
		<Asset {...tag} head />
	}
}

export function Scripts() @{
	const router = useRouter();
	const tags = track(
		() => uniqueAssets(
			composeSsrBodyScripts(
				getSsrBodyScriptParts(
					router.stores.matches.get(),
					router.ssr?.manifest,
					router.options.ssr?.nonce,
				),
			),
		),
	);
	@for (const tag of tags.value; key assetKey(tag)) {
		<Asset {...tag} />
	}
}

export function useHydrated() {
	const hydrated = track(false);
	effect(() => {
		hydrated.value = true;
	});
	return hydrated;
}

export function ClientOnly({ children, fallback }: { children?: Children; fallback?: Children }) @{
	const hydrated = useHydrated();
	@if (hydrated.value) {
		<>
			{children}
		</>
	} @else {
		<>
			{fallback}
		</>
	}
}
