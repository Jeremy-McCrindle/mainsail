// A small synthetic file tree: two sliced G-code files, the printer config and a log.

// Fixed timestamps keep test output stable: 2025-01-01 and 2025-01-02, 12:00 UTC.
const MODIFIED_FIRST = 1735732800
const MODIFIED_SECOND = 1735819200
const DISK_USAGE = { total: 30000000000, used: 6000000000, free: 24000000000 }

const file = (filename, size, modified) => ({ filename, size, modified, permissions: 'rw' })

export const GCODE_FILES = [
    {
        ...file('calibration_cube.gcode', 482113, MODIFIED_FIRST),
        metadata: {
            slicer: 'OrcaSlicer',
            slicer_version: '2.2.0',
            layer_height: 0.2,
            first_layer_height: 0.2,
            object_height: 20,
            filament_total: 1820.5,
            filament_weight_total: 5.43,
            estimated_time: 1260,
            first_layer_extr_temp: 210,
            first_layer_bed_temp: 60,
            nozzle_diameter: 0.4,
            filament_type: 'PLA',
            filament_name: 'Generic PLA',
            thumbnails: [],
        },
    },
    {
        ...file('benchy.gcode', 2310455, MODIFIED_SECOND),
        metadata: {
            slicer: 'OrcaSlicer',
            slicer_version: '2.2.0',
            layer_height: 0.2,
            first_layer_height: 0.2,
            object_height: 48,
            filament_total: 4610.2,
            filament_weight_total: 13.75,
            estimated_time: 3480,
            first_layer_extr_temp: 210,
            first_layer_bed_temp: 60,
            nozzle_diameter: 0.4,
            filament_type: 'PLA',
            filament_name: 'Generic PLA',
            thumbnails: [],
        },
    },
]

const DIRECTORIES = {
    gcodes: GCODE_FILES.map(({ filename, size, modified, permissions }) => ({
        filename,
        size,
        modified,
        permissions,
    })),
    config: [file('printer.cfg', 4096, MODIFIED_FIRST), file('moonraker.conf', 1024, MODIFIED_FIRST)],
    logs: [file('klippy.log', 20480, MODIFIED_SECOND), file('moonraker.log', 10240, MODIFIED_SECOND)],
}

const rootOf = (path) => path.split('/')[0]

// Only root directories exist; a subdirectory request gets an empty listing.
export const getDirectory = (path = 'gcodes') => {
    const root = rootOf(path)
    const files = path === root ? (DIRECTORIES[root] ?? []) : []

    return {
        dirs: [],
        files: files.map((entry) => ({ ...entry })),
        disk_usage: { ...DISK_USAGE },
        root_info: { name: root, permissions: root === 'logs' ? 'r' : 'rw' },
    }
}

export const isKnownRoot = (path) => rootOf(path) in DIRECTORIES

export const getMetadata = (filename) => {
    const entry = GCODE_FILES.find((gcodeFile) => gcodeFile.filename === filename)
    if (!entry) return null

    return { filename: entry.filename, size: entry.size, modified: entry.modified, ...entry.metadata }
}

export const listGcodeFiles = () =>
    GCODE_FILES.map(({ filename, size, modified, permissions }) => ({ path: filename, size, modified, permissions }))
