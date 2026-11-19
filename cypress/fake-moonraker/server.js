// The fake Moonraker: one HTTP server carrying Moonraker's HTTP API, the fake's /_fake
// control endpoints and the /websocket JSON-RPC endpoint Mainsail connects to.

import { createServer } from 'node:http'
import { WebSocketServer, WebSocket } from 'ws'
import { createState } from './state.js'
import { createHttpHandler } from './http-routes.js'
import { handleRpcMessage, logLine } from './rpc.js'
import { procStatUpdate } from './fixtures/server.js'
import { PROC_STAT_INTERVAL_MS } from './constants.js'
import { fakeMoonrakerHost, fakeMoonrakerPort } from './address.js'

const WEBSOCKET_PATH = '/websocket'

const parseMessage = (data) => {
    try {
        return JSON.parse(data.toString())
    } catch {
        return null
    }
}

const createBroadcast = (wss) => (method, params) => {
    const text = JSON.stringify({ jsonrpc: '2.0', method, params })
    for (const client of wss.clients) {
        if (client.readyState === WebSocket.OPEN) client.send(text)
    }
}

const handleConnection = (state, notify) => (socket) => {
    const context = { state, notify, transport: 'websocket', connectionId: state.nextConnectionId() }
    logLine(`websocket client ${context.connectionId} connected`)

    socket.on('message', (data) => {
        const message = parseMessage(data)
        if (message === null) return logLine(`ignored a message that is not JSON: ${data}`)

        socket.send(JSON.stringify(handleRpcMessage(message, context)))
    })
    socket.on('close', () => logLine(`websocket client ${context.connectionId} disconnected`))
}

const listen = (server, port, host) =>
    new Promise((resolve, reject) => {
        server.once('error', reject)
        server.listen(port, host, () => resolve(server.address()))
    })

export const startFakeMoonraker = async ({ port = fakeMoonrakerPort(), host = fakeMoonrakerHost() } = {}) => {
    const state = createState()
    const wss = new WebSocketServer({ noServer: true })
    const notify = createBroadcast(wss)
    const server = createServer(createHttpHandler({ state, notify, transport: 'http', connectionId: null }))

    wss.on('connection', handleConnection(state, notify))
    server.on('upgrade', (req, socket, head) => {
        if (new URL(req.url ?? '/', 'http://fake-moonraker').pathname !== WEBSOCKET_PATH) return socket.destroy()
        wss.handleUpgrade(req, socket, head, (client) => wss.emit('connection', client, req))
    })

    const procStatTimer = setInterval(
        () => notify('notify_proc_stat_update', [procStatUpdate()]),
        PROC_STAT_INTERVAL_MS
    )
    const address = await listen(server, port, host)
    logLine(`listening on http://${address.address}:${address.port} (websocket ${WEBSOCKET_PATH})`)

    const close = () =>
        new Promise((resolve) => {
            clearInterval(procStatTimer)
            for (const client of wss.clients) client.terminate()
            wss.close()
            server.close(() => resolve())
        })

    return { state, address, close }
}
