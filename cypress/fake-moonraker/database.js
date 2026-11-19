// Moonraker's database API over a plain object. Keys may be dotted paths into a namespace,
// as Mainsail writes them (for example "dashboard.desktopLayout1").

import { RpcError } from './rpc-error.js'
import { MOONRAKER_BAD_REQUEST, MOONRAKER_NOT_FOUND } from './constants.js'

// Keys that would reach Object.prototype if used as property names.
const UNSAFE_PARTS = new Set(['__proto__', 'constructor', 'prototype'])

const assertSafe = (parts) => {
    if (parts.some((part) => UNSAFE_PARTS.has(part)))
        throw new RpcError(MOONRAKER_BAD_REQUEST, `unsafe database key: ${parts.join('.')}`)
    return parts
}

const splitKey = (key) => assertSafe(key === undefined || key === null || key === '' ? [] : String(key).split('.'))

const notFound = (namespace, key) =>
    new RpcError(
        MOONRAKER_NOT_FOUND,
        key ? `Key '${key}' in namespace '${namespace}' not found` : `Namespace '${namespace}' not found`
    )

const readPath = (root, parts) =>
    parts.reduce((node, part) => (isObject(node) && part in node ? node[part] : undefined), root)

const isObject = (value) => value !== null && typeof value === 'object'

const clone = (value) => (value === undefined ? undefined : structuredClone(value))

export const listNamespaces = (database) => ({ namespaces: Object.keys(database), backups: [] })

export const getItem = (database, { namespace, key }) => {
    if (!(namespace in database)) throw notFound(namespace)

    const value = readPath(database[namespace], splitKey(key))
    if (value === undefined) throw notFound(namespace, key)

    return { namespace, key: key ?? null, value: clone(value) }
}

export const postItem = (database, { namespace, key, value }) => {
    const parts = splitKey(key)
    if (!namespace || parts.length === 0) throw new RpcError(MOONRAKER_BAD_REQUEST, 'namespace and key are required')
    assertSafe([namespace])

    const root = database[namespace] ?? {}
    database[namespace] = root

    const parent = parts.slice(0, -1).reduce((node, part) => {
        if (!isObject(node[part])) node[part] = {}
        return node[part]
    }, root)
    parent[parts.at(-1)] = clone(value)

    return { namespace, key, value: clone(value) }
}

export const deleteItem = (database, { namespace, key }) => {
    const parts = splitKey(key)
    const parent = readPath(database[namespace], parts.slice(0, -1))
    const last = parts.at(-1)
    if (!isObject(parent) || !(last in parent)) throw notFound(namespace, key)

    const value = parent[last]
    delete parent[last]

    return { namespace, key, value }
}
