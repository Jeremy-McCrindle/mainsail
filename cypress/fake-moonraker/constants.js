// Shared settings for the fake Moonraker and its Vite proxy config.

export const DEFAULT_HOST = '127.0.0.1'
export const DEFAULT_PORT = 7125

// Mainsail closes the socket after 10 s of silence; real Moonraker sends proc stats every second.
export const PROC_STAT_INTERVAL_MS = 1000

// The fake's own control endpoints: health, request log and reset.
export const CONTROL_PREFIX = '/_fake'

// Paths the Vite dev and preview servers forward to the fake, so Mainsail talks to it on its
// own origin, as it does behind nginx on a real printer.
export const PROXIED_PATHS = ['/websocket', '/server', '/printer', '/machine', '/access', '/api', CONTROL_PREFIX]

export const JSONRPC_METHOD_NOT_FOUND = -32601
export const JSONRPC_INVALID_REQUEST = -32600
export const JSONRPC_INTERNAL_ERROR = -32603
export const MOONRAKER_NOT_FOUND = 404
export const MOONRAKER_BAD_REQUEST = 400
