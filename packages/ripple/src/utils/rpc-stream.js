export const RPC_STREAM_TYPE = 'application/x-ripple-stream;v=1';
export const RPC_FRAME_LIMIT = 8 * 1024 * 1024;

/** Only transport failures from the streaming RPC reader permit read recovery. */
export class RpcTransportError extends Error {}
