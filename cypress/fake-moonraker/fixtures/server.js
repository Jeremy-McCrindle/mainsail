// Moonraker's own answers: server.info, server.config, machine.system_info and proc stats.
// Everything here is synthetic; the hostname is the generic "printer".

export const PRINTER_HOSTNAME = 'printer'
export const KLIPPER_VERSION = 'v0.12.0-0-gfake'
export const MOONRAKER_VERSION = 'v0.9.3-0-gfake'
export const API_VERSION = [1, 5, 0]

const SYSTEM_UPTIME_S = 3600
const CPU_TEMPERATURE_C = 45.2
const TOTAL_MEMORY_KB = 4000000

export const REGISTERED_DIRECTORIES = ['config', 'logs', 'gcodes']

// Only components the fake answers; Mainsail initialises each one it sees here.
export const COMPONENTS = [
    'klippy_connection',
    'application',
    'websockets',
    'internal_transport',
    'dbus_manager',
    'database',
    'file_manager',
    'klippy_apis',
    'secrets',
    'template',
    'shell_command',
    'machine',
    'data_store',
    'proc_stats',
    'job_state',
    'job_queue',
    'history',
    'authorization',
    'announcements',
    'webcam',
    'extensions',
]

export const serverInfo = () => ({
    klippy_connected: true,
    klippy_state: 'ready',
    components: [...COMPONENTS],
    failed_components: [],
    registered_directories: [...REGISTERED_DIRECTORIES],
    warnings: [],
    websocket_count: 1,
    moonraker_version: MOONRAKER_VERSION,
    missing_klippy_requirements: [],
    api_version: [...API_VERSION],
    api_version_string: API_VERSION.join('.'),
})

export const printerInfo = () => ({
    state: 'ready',
    state_message: 'Printer is ready',
    hostname: PRINTER_HOSTNAME,
    klipper_path: '/printer_data/klipper',
    python_path: '/printer_data/klippy-env/bin/python',
    process_id: 1000,
    user_id: 1000,
    group_id: 1000,
    log_file: '/printer_data/logs/klippy.log',
    config_file: '/printer_data/config/printer.cfg',
    software_version: KLIPPER_VERSION,
    cpu_info: '4 core ARM',
})

export const serverConfig = () => ({
    config: {
        server: { host: '0.0.0.0', port: 7125, klippy_uds_address: '/printer_data/comms/klippy.sock' },
        file_manager: { enable_object_processing: false },
        history: {},
        announcements: { subscriptions: [] },
        job_queue: { load_on_startup: false },
    },
    orig: {},
    files: [],
})

const SERVICE_RUNNING = { active_state: 'active', sub_state: 'running' }

export const systemInfo = () => ({
    system_info: {
        provider: 'systemd_dbus',
        cpu_info: {
            cpu_count: 4,
            bits: '64bit',
            processor: 'aarch64',
            cpu_desc: '',
            serial_number: '',
            hardware_desc: '',
            model: 'Fake single-board computer',
            total_memory: TOTAL_MEMORY_KB,
            memory_units: 'kB',
        },
        sd_info: {},
        distribution: {
            name: 'Debian GNU/Linux 12 (bookworm)',
            id: 'debian',
            version: '12',
            version_parts: { major: '12', minor: '', build_number: '' },
            like: '',
            codename: 'bookworm',
            release_info: {},
        },
        available_services: ['klipper', 'moonraker'],
        instance_ids: { moonraker: 'moonraker', klipper: 'klipper' },
        service_state: { klipper: { ...SERVICE_RUNNING }, moonraker: { ...SERVICE_RUNNING } },
        virtualization: { virt_type: 'none', virt_identifier: 'none' },
        python: { version: [3, 11, 2, 'final', 0], version_string: '3.11.2' },
        network: {},
        canbus: {},
    },
})

export const procStats = () => ({
    moonraker_stats: [{ time: Date.now() / 1000, cpu_usage: 1.5, memory: 40000, mem_units: 'kB' }],
    throttled_state: { bits: 0, flags: [] },
    cpu_temp: CPU_TEMPERATURE_C,
    network: {},
    system_cpu_usage: { cpu: 3.5, cpu0: 3, cpu1: 4, cpu2: 3, cpu3: 4 },
    system_memory: { total: TOTAL_MEMORY_KB, available: TOTAL_MEMORY_KB / 2, used: TOTAL_MEMORY_KB / 2 },
    system_uptime: SYSTEM_UPTIME_S,
    websocket_connections: 1,
})

// The periodic notification: Mainsail treats a 10 s silent socket as dead.
export const procStatUpdate = () => {
    const stats = procStats()

    return {
        moonraker_stats: stats.moonraker_stats[0],
        cpu_temp: stats.cpu_temp,
        network: stats.network,
        system_cpu_usage: stats.system_cpu_usage,
        system_memory: stats.system_memory,
        websocket_connections: stats.websocket_connections,
    }
}
