// The JSON-RPC methods the fake answers. Each handler gets the request's params and a
// context { state, notify, connectionId } and returns the result, or throws an RpcError.

import { RpcError } from './rpc-error.js'
import { MOONRAKER_BAD_REQUEST, MOONRAKER_NOT_FOUND } from './constants.js'
import { runGcodeScript } from './gcode.js'
import { deleteItem, getItem, listNamespaces, postItem } from './database.js'
import { getDirectory, getMetadata, isKnownRoot, listGcodeFiles } from './fixtures/files.js'
import { printerInfo, procStats, serverConfig, serverInfo, systemInfo } from './fixtures/server.js'

const TEMPERATURE_HISTORY_POINTS = 60
const OK = 'ok'

const eventtime = () => process.uptime()

const pickFields = (object, fields) =>
    Array.isArray(fields) ? Object.fromEntries(fields.filter((f) => f in object).map((f) => [f, object[f]])) : object

const queryObjects = (objects, requested = {}) => ({
    eventtime: eventtime(),
    status: Object.fromEntries(
        Object.entries(requested)
            .filter(([name]) => name in objects)
            .map(([name, fields]) => [name, structuredClone(pickFields(objects[name], fields))])
    ),
})

const temperatureStore = (objects) =>
    Object.fromEntries(
        objects.heaters.available_sensors.map((name) => {
            const sensor = objects[name]
            const series = (value) => Array.from({ length: TEMPERATURE_HISTORY_POINTS }, () => value)

            return [name, { temperatures: series(sensor.temperature), targets: series(0), powers: series(0) }]
        })
    )

const requireParam = (params, name) => {
    if (params?.[name] === undefined) throw new RpcError(MOONRAKER_BAD_REQUEST, `No data for argument: ${name}`)
    return params[name]
}

const metadata = (params) => {
    const filename = requireParam(params, 'filename')
    const result = getMetadata(filename)
    if (!result) throw new RpcError(MOONRAKER_NOT_FOUND, `Metadata not available for <${filename}>`)

    return result
}

const directory = (params) => {
    const path = params?.path ?? 'gcodes'
    if (!isKnownRoot(path)) throw new RpcError(MOONRAKER_BAD_REQUEST, `Invalid root path (${path})`)

    return getDirectory(path)
}

const EMPTY_JOB_TOTALS = {
    total_jobs: 0,
    total_time: 0,
    total_print_time: 0,
    total_filament_used: 0,
    longest_job: 0,
    longest_print: 0,
}

export const RPC_METHODS = {
    'server.connection.identify': (_params, { connectionId }) => ({ connection_id: connectionId }),
    'server.info': () => serverInfo(),
    'server.config': () => serverConfig(),
    'server.temperature_store': (_params, { state }) => temperatureStore(state.objects),
    'server.gcode_store': (_params, { state }) => ({ gcode_store: [...state.gcodeStore] }),
    'machine.system_info': () => systemInfo(),
    'machine.proc_stats': () => procStats(),

    'printer.info': () => printerInfo(),
    'printer.objects.list': (_params, { state }) => ({ objects: Object.keys(state.objects) }),
    'printer.objects.query': (params, { state }) => queryObjects(state.objects, params?.objects),
    'printer.objects.subscribe': (params, { state }) => queryObjects(state.objects, params?.objects),
    'printer.gcode.script': (params, { state, notify }) =>
        runGcodeScript(state, notify, requireParam(params, 'script')),
    'printer.emergency_stop': () => OK,
    'printer.restart': () => OK,
    'printer.firmware_restart': () => OK,
    'printer.print.start': () => OK,
    'printer.print.pause': () => OK,
    'printer.print.resume': () => OK,
    'printer.print.cancel': () => OK,

    'server.database.list': (_params, { state }) => listNamespaces(state.database),
    'server.database.get_item': (params, { state }) => getItem(state.database, params ?? {}),
    'server.database.post_item': (params, { state }) => postItem(state.database, params ?? {}),
    'server.database.delete_item': (params, { state }) => deleteItem(state.database, params ?? {}),

    'server.files.list': () => listGcodeFiles(),
    'server.files.get_directory': (params) => directory(params),
    'server.files.metadata': (params) => metadata(params),
    'server.files.metascan': (params) => metadata(params),

    'server.history.list': () => ({ count: 0, jobs: [] }),
    'server.history.totals': () => ({ job_totals: { ...EMPTY_JOB_TOTALS }, auxiliary_totals: [] }),
    'server.job_queue.status': () => ({ queued_jobs: [], queue_state: 'ready' }),
    'server.announcements.list': () => ({ entries: [], feeds: [] }),
    'server.webcams.list': () => ({ webcams: [] }),
    'server.sensors.list': () => ({ sensors: {} }),
}
