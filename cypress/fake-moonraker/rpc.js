// JSON-RPC 2.0 dispatch shared by the websocket and the HTTP API. Every call is recorded;
// unknown methods get a "method not found" error and a log line, never silence.

import { RpcError } from './rpc-error.js'
import { RPC_METHODS } from './rpc-methods.js'
import { JSONRPC_INTERNAL_ERROR, JSONRPC_INVALID_REQUEST, JSONRPC_METHOD_NOT_FOUND } from './constants.js'

const LOG_PREFIX = '[fake-moonraker]'
export const INTERNAL_ERROR_MESSAGE = 'Internal error in the fake Moonraker; see its log'

const errorResponse = (id, error) => ({ jsonrpc: '2.0', error: error.toJson(), id: id ?? null })

export const callMethod = (method, params, context) => {
    context.state.recordRequest(context.transport, method, params ?? null)

    const handler = RPC_METHODS[method]
    if (!handler) {
        console.warn(`${LOG_PREFIX} unknown method: ${method}`)
        throw new RpcError(JSONRPC_METHOD_NOT_FOUND, `Method not found: ${method}`)
    }

    return handler(params, context)
}

const handleOne = (message, context) => {
    if (typeof message?.method !== 'string') {
        return errorResponse(message?.id, new RpcError(JSONRPC_INVALID_REQUEST, 'Invalid Request'))
    }

    try {
        const result = callMethod(message.method, message.params, context)
        return { jsonrpc: '2.0', result, id: message.id ?? null }
    } catch (error) {
        if (error instanceof RpcError) return errorResponse(message.id, error)

        // Internal failures stay in the fake's log; the client gets no stack or message.
        console.error(`${LOG_PREFIX} ${message.method} failed:`, error)
        return errorResponse(message.id, new RpcError(JSONRPC_INTERNAL_ERROR, INTERNAL_ERROR_MESSAGE))
    }
}

// Mainsail sends batches as JSON arrays and expects an array back.
export const handleRpcMessage = (message, context) =>
    Array.isArray(message) ? message.map((entry) => handleOne(entry, context)) : handleOne(message, context)

export const logLine = (text) => console.log(`${LOG_PREFIX} ${text}`)
