// The fake's mutable state: printer objects, database, console history and the request log.
// One instance per server; reset() puts it back to a freshly booted, idle printer.

import { printerObjects } from './fixtures/printer-objects.js'
import { databaseNamespaces } from './fixtures/namespaces.js'

// Long preview sessions should not grow the log without bound.
const MAX_LOGGED_REQUESTS = 2000
const MAX_GCODE_STORE = 1000

const freshState = () => ({
    objects: printerObjects(),
    database: databaseNamespaces(),
    gcodeStore: [],
    requests: [],
    nextRequestId: 1,
    nextConnectionId: 1,
})

const keepLast = (list, max) => (list.length > max ? list.slice(list.length - max) : list)

export const createState = () => {
    const state = freshState()

    return {
        get objects() {
            return state.objects
        },
        get database() {
            return state.database
        },
        get gcodeStore() {
            return state.gcodeStore
        },

        reset() {
            Object.assign(state, freshState())
        },

        nextConnectionId() {
            return state.nextConnectionId++
        },

        recordRequest(transport, method, params) {
            const entry = { id: state.nextRequestId++, time: Date.now() / 1000, transport, method, params }
            state.requests = keepLast([...state.requests, entry], MAX_LOGGED_REQUESTS)

            return entry
        },

        requests(method) {
            return method ? state.requests.filter((entry) => entry.method === method) : [...state.requests]
        },

        addGcodeStoreEntry(message, type) {
            const entry = { message, time: Date.now() / 1000, type }
            state.gcodeStore = keepLast([...state.gcodeStore, entry], MAX_GCODE_STORE)

            return entry
        },
    }
}
