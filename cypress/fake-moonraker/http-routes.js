// HTTP side of the fake: its control endpoints under /_fake, and Moonraker's HTTP API,
// which mirrors the JSON-RPC methods (/server/history/totals -> server.history.totals).

import { RpcError } from './rpc-error.js'
import { callMethod, INTERNAL_ERROR_MESSAGE, logLine } from './rpc.js'
import { CONTROL_PREFIX, JSONRPC_METHOD_NOT_FOUND, MOONRAKER_NOT_FOUND } from './constants.js'

const HTTP_OK = 200
const HTTP_NO_CONTENT = 204
const HTTP_BAD_REQUEST = 400
const HTTP_NOT_FOUND = 404
const HTTP_SERVER_ERROR = 500

// Paths whose HTTP verb picks the method, as in Moonraker.
const VERB_METHODS = {
    '/server/database/item': {
        GET: 'server.database.get_item',
        POST: 'server.database.post_item',
        DELETE: 'server.database.delete_item',
    },
    '/server/files/directory': { GET: 'server.files.get_directory' },
}

const FILES_PREFIX = '/server/files/'
const FILE_API_ROUTES = ['list', 'metadata', 'metascan', 'directory']

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Api-Key',
}

const sendJson = (res, status, body) => {
    res.writeHead(status, { ...CORS_HEADERS, 'Content-Type': 'application/json' })
    res.end(JSON.stringify(body))
}

const sendError = (res, status, message) => sendJson(res, status, { error: { code: status, message } })

const readBody = async (req) => {
    const chunks = []
    for await (const chunk of req) chunks.push(chunk)
    const text = Buffer.concat(chunks).toString('utf8')
    if (!text) return {}

    try {
        return JSON.parse(text)
    } catch {
        throw new RpcError(HTTP_BAD_REQUEST, 'Request body is not valid JSON')
    }
}

const httpStatusFor = (error) => {
    if (error.code === JSONRPC_METHOD_NOT_FOUND || error.code === MOONRAKER_NOT_FOUND) return HTTP_NOT_FOUND
    return HTTP_BAD_REQUEST
}

const handleControl = async (req, res, url, state) => {
    const route = url.pathname.slice(CONTROL_PREFIX.length)

    // start-server-and-test probes with HEAD.
    if (['GET', 'HEAD'].includes(req.method) && route === '/health') return sendJson(res, HTTP_OK, { ok: true })
    if (req.method === 'GET' && route === '/requests') {
        return sendJson(res, HTTP_OK, state.requests(url.searchParams.get('method') ?? undefined))
    }
    if (req.method === 'POST' && route === '/reset') {
        state.reset()
        res.writeHead(HTTP_NO_CONTENT, CORS_HEADERS)
        return res.end()
    }

    return sendError(res, HTTP_NOT_FOUND, `No fake control endpoint ${req.method} ${url.pathname}`)
}

// File downloads (config files, theme files, logs) are not part of the fake's printer.
const handleFileDownload = (req, res, url, state) => {
    state.recordRequest('http', 'file_download', { path: url.pathname.slice(FILES_PREFIX.length) })
    sendError(res, HTTP_NOT_FOUND, `File not found: ${url.pathname}`)
}

const methodFor = (req, pathname) =>
    VERB_METHODS[pathname]?.[req.method] ?? pathname.replace(/^\//, '').split('/').join('.')

const handleApi = async (req, res, url, context) => {
    const params = { ...Object.fromEntries(url.searchParams), ...(req.method === 'POST' ? await readBody(req) : {}) }
    const result = callMethod(methodFor(req, url.pathname), params, context)
    sendJson(res, HTTP_OK, { result })
}

const isFileDownload = (pathname) =>
    pathname.startsWith(FILES_PREFIX) && !FILE_API_ROUTES.includes(pathname.slice(FILES_PREFIX.length))

export const createHttpHandler = (context) => async (req, res) => {
    const url = new URL(req.url ?? '/', 'http://fake-moonraker')

    if (req.method === 'OPTIONS') {
        res.writeHead(HTTP_NO_CONTENT, CORS_HEADERS)
        return res.end()
    }

    try {
        if (url.pathname.startsWith(CONTROL_PREFIX)) return await handleControl(req, res, url, context.state)
        if (isFileDownload(url.pathname)) return handleFileDownload(req, res, url, context.state)

        return await handleApi(req, res, url, context)
    } catch (error) {
        if (error instanceof RpcError) return sendError(res, httpStatusFor(error), error.message)

        // Internal failures stay in the fake's log; the client gets no stack or message.
        logLine(`${req.method} ${url.pathname} failed: ${error instanceof Error ? error.stack : error}`)
        sendError(res, HTTP_SERVER_ERROR, INTERNAL_ERROR_MESSAGE)
    }
}
