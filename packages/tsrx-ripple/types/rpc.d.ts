export type RpcModules = Map<string, [string, string]>;

declare global {
	var rpc_modules: RpcModules | undefined;
}
